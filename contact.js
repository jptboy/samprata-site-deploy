(() => {
  'use strict';
  const form = document.getElementById('contact-form');
  if (!form) return;

  const fields = [...form.querySelectorAll('input:not([type="hidden"]):not([name="_gotcha"]), textarea')];
  const submitButton = document.getElementById('contact-submit');
  const submitLabel = document.getElementById('contact-submit-label');
  const spinner = form.querySelector('.contact-spinner');
  const submitMark = form.querySelector('.contact-submit-mark');
  const feedback = document.getElementById('contact-feedback');
  const verificationButton = document.getElementById('contact-verification');
  let pending = false;
  let lastSuccessfulPayload = null;
  let verificationRequired = false;

  // Retain native validation and normal POST when JavaScript is unavailable.
  form.noValidate = true;

  function fieldError(field, message = '') {
    const target = document.getElementById(`${field.id}-error`);
    if (target) {
      target.textContent = message;
      target.hidden = !message;
    }
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }

  function validate() {
    let firstInvalid = null;
    fields.forEach(field => {
      field.value = field.value.trim();
      let message = '';
      if (field.required && !field.value) {
        message = field.name === 'message' ? 'Tell us a little about your project.' : field.name === 'email' ? 'Enter your email address.' : 'Enter your name.';
      } else if (field.validity.typeMismatch) {
        message = 'Enter a valid email address, such as name@company.com.';
      } else if (field.validity.tooLong) {
        message = `Use ${field.maxLength} characters or fewer.`;
      } else if (!field.validity.valid) {
        message = 'Please check this field.';
      }
      fieldError(field, message);
      if (message && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      showFeedback('error', 'Please check the highlighted fields.');
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  function showFeedback(state, message, focus = false) {
    feedback.dataset.state = state;
    feedback.textContent = message;
    feedback.hidden = false;
    if (focus) feedback.focus({ preventScroll: true });
  }

  function setPending(value) {
    pending = value;
    form.setAttribute('aria-busy', String(value));
    submitButton.disabled = value;
    verificationButton.disabled = value;
    submitLabel.textContent = value ? 'Sending…' : 'Send message';
    spinner.hidden = !value;
    submitMark.hidden = value;
    fields.forEach(field => { field.readOnly = value; });
  }

  function requestVerification() {
    verificationRequired = true;
    verificationButton.hidden = false;
    showFeedback('error', 'One more step is needed. Continue to Formspree to complete the verification and send your message.', true);
  }

  fields.forEach(field => field.addEventListener('input', () => {
    fieldError(field);
    verificationRequired = false;
    verificationButton.hidden = true;
    if (!pending) feedback.hidden = true;
  }));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (pending || !validate()) return;
    if (verificationRequired) {
      verificationButton.focus();
      return;
    }

    const data = new FormData(form);
    const payloadSignature = JSON.stringify([...data.entries()]);
    if (payloadSignature === lastSuccessfulPayload) {
      showFeedback('success', 'This message has already been sent. Thank you for getting in touch.', true);
      return;
    }

    verificationButton.hidden = true;
    setPending(true);
    showFeedback('pending', 'Sending your message…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
        mode: 'cors',
        signal: controller.signal
      });
      const result = await response.json().catch(() => null);
      const errors = Array.isArray(result?.errors) ? result.errors : [];
      const errorText = [result?.error, result?.code, ...errors.map(error => `${error.code || ''} ${error.message || ''}`)].filter(Boolean).join(' ');
      const challengeNext = typeof result?.next === 'string' && /captcha|challenge|verify/i.test(result.next);

      if (/captcha|recaptcha|verify.*human|human.*verification/i.test(errorText) || challengeNext) {
        requestVerification();
        return;
      }

      if (response.status === 429) {
        showFeedback('error', 'Too many messages were submitted recently. Please wait a few minutes, then try again. Your message is still here.', true);
        return;
      }

      if (!response.ok || errors.length || result?.error) {
        let firstInvalid = null;
        errors.forEach(error => {
          const field = fields.find(candidate => candidate.name === error.field);
          if (field) {
            fieldError(field, typeof error.message === 'string' ? error.message : 'Please check this field.');
            if (!firstInvalid) firstInvalid = field;
          }
        });
        showFeedback('error', firstInvalid ? 'Please check the highlighted fields and try again.' : 'Your message could not be sent. Please try again in a moment. Your details are still here.', !firstInvalid);
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // An HTML challenge or unexpected response must not be reported as delivery.
      if (!result || (result.ok !== true && typeof result.next !== 'string')) {
        showFeedback('error', 'We could not confirm that your message was sent. Your details are still here; please try again later.', true);
        return;
      }

      lastSuccessfulPayload = payloadSignature;
      form.reset();
      fields.forEach(field => fieldError(field));
      showFeedback('success', 'Message sent. Thank you for reaching out — the team will get back to you at the email you provided.', true);
    } catch (error) {
      const message = error.name === 'AbortError'
        ? 'The request timed out, so we could not confirm delivery. Your message is still here; please wait before trying again.'
        : 'We could not confirm delivery. Check your connection and try again when it’s stable. Your message is still here.';
      showFeedback('error', message, true);
    } finally {
      clearTimeout(timeout);
      setPending(false);
    }
  });

  verificationButton.addEventListener('click', () => {
    if (pending || !validate()) return;
    setPending(true);
    showFeedback('pending', 'Opening Formspree verification…');
    // Native POST follows the provider's hosted CAPTCHA flow without bypassing it.
    HTMLFormElement.prototype.submit.call(form);
  });

  // Restore an interactive form if the visitor returns from hosted verification.
  window.addEventListener('pageshow', event => {
    if (event.persisted) {
      setPending(false);
      feedback.hidden = true;
    }
  });
})();
