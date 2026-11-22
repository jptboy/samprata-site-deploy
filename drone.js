import * as THREE from './vendor/three.module.js';

const canvas = document.querySelector('#drone-canvas');
const container = document.querySelector('#drone-render');
const story = document.querySelector('.drone-story');
const stage = document.querySelector('.drone-stage');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try { renderer = new THREE.WebGLRenderer({canvas, antialias:true,alpha:true,powerPreference:'high-performance'}); }
catch { document.querySelector('.drone-fallback').hidden=false; }
if(renderer) init();

function init(){
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setClearColor(0x101411,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.35;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(31,1,.1,100);
camera.position.set(8,6.3,10.6);camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xe0f0e8,0x263522,3));
const key=new THREE.DirectionalLight(0xffffff,5.5);key.position.set(3,7,5);scene.add(key);
const rim=new THREE.DirectionalLight(0xc8efa4,4.0);rim.position.set(-6,3,-5);scene.add(rim);
const fill=new THREE.DirectionalLight(0x94aaba,2.4);fill.position.set(0,-1,8);scene.add(fill);
const root=new THREE.Group();scene.add(root);
const parts=[];const propellers=[];
const matte=new THREE.MeshPhysicalMaterial({color:0x3d4840,roughness:.42,metalness:.55,clearcoat:.25});
const shell=new THREE.MeshPhysicalMaterial({color:0xb1b9ae,roughness:.31,metalness:.42,clearcoat:.45});
const dark=new THREE.MeshStandardMaterial({color:0x202821,roughness:.55,metalness:.5});
const carbon=new THREE.MeshStandardMaterial({color:0x29332b,roughness:.4,metalness:.65});
const metal=new THREE.MeshStandardMaterial({color:0x859083,roughness:.3,metalness:.85});
const accent=new THREE.MeshStandardMaterial({color:0xcaf486,roughness:.38,metalness:.25,emissive:0x344b0c,emissiveIntensity:.23});
const black=new THREE.MeshStandardMaterial({color:0x080f0c,roughness:.38,metalness:.4});
const glass=new THREE.MeshPhysicalMaterial({color:0x244a3d,roughness:.1,metalness:.75,clearcoat:1});
const led=new THREE.MeshBasicMaterial({color:0xcaf486});
function mesh(geo,mat,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);parent.add(m);return m}
function box(w,h,d,mat,parent,x=0,y=0,z=0){return mesh(new THREE.BoxGeometry(w,h,d),mat,parent,x,y,z)}
function cylinder(r1,r2,h,mat,parent,x=0,y=0,z=0,segments=32){return mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat,parent,x,y,z)}
function roundedPrism(w,d,h,r,mat,parent,x=0,y=0,z=0){const s=new THREE.Shape(), a=w/2,b=d/2;s.moveTo(-a+r,-b);s.lineTo(a-r,-b);s.quadraticCurveTo(a,-b,a,-b+r);s.lineTo(a,b-r);s.quadraticCurveTo(a,b,a-r,b);s.lineTo(-a+r,b);s.quadraticCurveTo(-a,b,-a,b-r);s.lineTo(-a,-b+r);s.quadraticCurveTo(-a,-b,-a+r,-b);const g=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.045,curveSegments:12});g.rotateX(-Math.PI/2);g.translate(0,-h/2,0);return mesh(g,mat,parent,x,y,z)}
function pipe(a,b,r,mat,parent){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);const m=cylinder(r,r,av.distanceTo(bv),mat,parent);m.position.copy(av).add(bv).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),bv.sub(av).normalize());return m}
function part(name,pos,delta){const g=new THREE.Group();g.position.set(...pos);g.userData={name,home:new THREE.Vector3(...pos),delta:new THREE.Vector3(...delta)};root.add(g);parts.push(g);return g}
function screw(parent,x,y,z){cylinder(.035,.035,.018,metal,parent,x,y,z,12);box(.035,.008,.006,black,parent,x,y+.012,z)}
// Central flight core, with visible internal plates in the exploded state.
const core=part('Flight core',[0,0,0],[0,0,0]);
roundedPrism(1.25,1.82,.3,.22,dark,core,0,0,0);
roundedPrism(1.08,1.62,.07,.12,metal,core,0,.19,0);
box(.8,.07,1.15,new THREE.MeshStandardMaterial({color:0x345344,roughness:.72}),core,0,.25,0);
for(let i=0;i<5;i++)box(.105,.07,.48,black,core,-.31+i*.155,.32,-.12);
for(const x of [-.46,.46])for(const z of [-.66,.66])screw(core,x,.25,z);
// Sculpted removable upper shell, accent stripes, sensor window, and fine cooling slots.
const cover=part('Upper shell',[0,.42,0],[0,1.55,0]);
roundedPrism(1.22,1.81,.22,.24,shell,cover);
roundedPrism(.91,1.34,.14,.16,matte,cover,0,.18,-.06);
box(.035,.015,.93,accent,cover,-.29,.264,-.06);box(.035,.015,.93,accent,cover,.29,.264,-.06);
for(let i=0;i<7;i++)box(.42,.015,.025,black,cover,0,.266,-.4+i*.1);
roundedPrism(.55,.3,.06,.07,black,cover,0,.12,.76);
box(.2,.012,.035,led,cover,0,.16,.82);
// Battery module pulled back from the aircraft in the exploded view.
const battery=part('Power module',[0,.21,-.65],[0,.42,-1.65]);
roundedPrism(.84,.66,.27,.09,dark,battery,0,.18,0);
box(.53,.012,.25,matte,battery,0,.33,-.05);
for(let i=0;i<4;i++)box(.035,.012,.065,led,battery,-.09+i*.06,.337,.15);
box(.4,.1,.05,black,battery,0,.19,-.36);
// Four carbon booms and machined motors. Rotor assemblies lift independently.
for(const sx of [-1,1])for(const sz of [-1,1]){
 const x=sx*1.95,z=sz*1.55;
 const boom=part('Arm and motor',[0,0,0],[sx*1.1,.16,sz*.8]);
 pipe([sx*.46,.02,sz*.53],[x,.08,z],.105,carbon,boom);
 pipe([sx*.5,-.07,sz*.55],[x,-.02,z],.045,metal,boom);
 const collar=cylinder(.16,.16,.24,matte,boom,sx*.66,.015,sz*.71);collar.rotation.z=Math.PI/2;collar.rotation.y=-sx*sz*.58;
 cylinder(.27,.22,.18,dark,boom,x,.14,z);
 cylinder(.23,.23,.21,metal,boom,x,.29,z);
 cylinder(.25,.25,.045,accent,boom,x,.41,z);
 cylinder(.205,.205,.14,carbon,boom,x,.5,z);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;box(.025,.1,.045,black,boom,x+Math.cos(a)*.21,.29,z+Math.sin(a)*.21)}
 const rotor=part('Rotor',[x,.61,z],[sx*1.1,1.05,sz*.8]);
 const blades=new THREE.Group();rotor.add(blades);propellers.push(blades);
 cylinder(.09,.13,.1,metal,blades,0,.02,0);
 const bladeShape=new THREE.Shape();bladeShape.moveTo(.05,-.035);bladeShape.bezierCurveTo(.27,-.15,.68,-.14,.84,-.045);bladeShape.quadraticCurveTo(.93,.035,.78,.073);bladeShape.lineTo(.16,.06);bladeShape.closePath();
 const bladeGeometry=new THREE.ExtrudeGeometry(bladeShape,{depth:.018,bevelEnabled:true,bevelSize:.01,bevelThickness:.008,bevelSegments:2,steps:1});bladeGeometry.rotateX(-Math.PI/2);
 for(let side=0;side<2;side++){const blade=mesh(bladeGeometry,carbon,blades);blade.rotation.y=side*Math.PI;const tip=box(.1,.018,.07,accent,blades,side?-.77:.77,.027,0);tip.rotation.y=side*Math.PI}
 for(const ox of [-.12,.12])screw(boom,x+ox,.59,z);
 // Position lights on motor ends.
 box(.14,.055,.075,sz>0?led:new THREE.MeshBasicMaterial({color:0xd2e6ff}),boom,x,.12,z+sz*.235);
}
// Carbon landing frame, separated vertically as a unit.
const gear=part('Landing frame',[0,-.25,0],[0,-1.1,.05]);
for(const sx of [-1,1]){
 pipe([sx*.48,.1,-.58],[sx*.7,-.79,-.65],.04,metal,gear);
 pipe([sx*.48,.1,.58],[sx*.7,-.79,.65],.04,metal,gear);
 pipe([sx*.7,-.79,-1.02],[sx*.7,-.79,1.02],.055,carbon,gear);
 cylinder(.07,.07,.08,black,gear,sx*.7,-.79,-.99).rotation.x=Math.PI/2;
 cylinder(.07,.07,.08,black,gear,sx*.7,-.79,.99).rotation.x=Math.PI/2;
}
// Forward gimbal camera, glazed lens, and lower spatial sensor.
const payload=part('Spatial payload',[0,-.3,.63],[0,-1.65,.58]);
box(.48,.11,.32,matte,payload,0,0,0);
for(const sx of [-1,1])box(.06,.28,.1,metal,payload,sx*.22,-.18,.06);
const ball=mesh(new THREE.SphereGeometry(.28,32,24),shell,payload,0,-.34,.08);ball.scale.set(1,.88,.9);
const lens=cylinder(.15,.16,.14,black,payload,0,-.34,.32);lens.rotation.x=Math.PI/2;
const lensFace=cylinder(.115,.115,.012,glass,payload,0,-.34,.399);lensFace.rotation.x=Math.PI/2;
const lensInner=cylinder(.065,.065,.014,black,payload,0,-.34,.41);lensInner.rotation.x=Math.PI/2;
const glint=mesh(new THREE.SphereGeometry(.023,12,12),new THREE.MeshBasicMaterial({color:0x93c8c2}),payload,-.04,-.3,.423);
const lidar=part('LiDAR sensor',[0,-.4,-.24],[0,-1.75,-.45]);
cylinder(.26,.29,.18,dark,lidar,0,-.08,0);
cylinder(.24,.24,.18,glass,lidar,0,-.25,0);
cylinder(.275,.275,.045,metal,lidar,0,-.36,0);
cylinder(.18,.24,.07,black,lidar,0,-.415,0);
for(let i=0;i<16;i++){const a=i*Math.PI/8;box(.022,.095,.022,metal,lidar,Math.cos(a)*.25,-.1,Math.sin(a)*.25)}
// Top GNSS puck and antenna introduce a second recognizable hardware plane.
const positioning=part('Positioning',[0,.55,.48],[0,1.92,.2]);
cylinder(.22,.23,.08,shell,positioning,0,.08,0);
cylinder(.19,.19,.025,accent,positioning,0,.135,0);
// Thin engineering alignment lines become visible only when components separate.
const guideMaterial=new THREE.LineDashedMaterial({color:0xcaf486,transparent:true,opacity:0,dashSize:.035,gapSize:.055});
const guides=[];
for(const p of parts){if(!p.userData.delta.length())continue;const geom=new THREE.BufferGeometry().setFromPoints([p.userData.home,p.userData.home.clone().add(p.userData.delta)]);const line=new THREE.Line(geom,guideMaterial);line.computeLineDistances();root.add(line);guides.push(line)}
root.rotation.y=-.38;
let progress=0,currentExplosion=0,targetExplosion=0,manual=null,lastPhase=-1,renderActive=true,pointerX=0,pointerY=0,lastTime=0;
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
const smooth=(a,b,v)=>{const x=clamp((v-a)/(b-a));return x*x*(3-2*x)};
const flight=document.querySelector('#drone-flight-view'),exploded=document.querySelector('#drone-exploded-view');
function setState(){const r=story.getBoundingClientRect();progress=clamp(-r.top/Math.max(1,story.offsetHeight-innerHeight));const explosion=smooth(.13,.4,progress)*(1-smooth(.66,.91,progress));targetExplosion=manual===null?explosion:manual;const phase=manual===1?1:progress<.22?0:progress<.78?1:2;if(phase!==lastPhase){document.querySelectorAll('[data-story-panel]').forEach(p=>{const active=Number(p.dataset.storyPanel)===phase;p.classList.toggle('is-active',active);p.inert=!active});stage.dataset.phase=String(phase);lastPhase=phase}stage.style.setProperty('--story-progress',`${progress*100}%`);const isExploded=targetExplosion>.5;flight.setAttribute('aria-pressed',String(!isExploded));exploded.setAttribute('aria-pressed',String(isExploded));document.querySelector('#scroll-stage-label').textContent=progress>.8?'CONTINUE TO THE CAPTURE EXPERIENCE':isExploded?'SCROLL TO BRING IT ALL TOGETHER':'SCROLL TO EXPLORE THE ARCHITECTURE'}
flight.addEventListener('click',()=>{manual=0;setState()});exploded.addEventListener('click',()=>{manual=1;setState()});
window.addEventListener('scroll',()=>{manual=null;setState()},{passive:true});
container.addEventListener('pointermove',e=>{const r=container.getBoundingClientRect();pointerX=((e.clientX-r.left)/r.width-.5)*.16;pointerY=((e.clientY-r.top)/r.height-.5)*.06},{passive:true});container.addEventListener('pointerleave',()=>{pointerX=pointerY=0});
function resize(){const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;const mobile=innerWidth<=700,compact=!mobile&&innerWidth<=1100;camera.position.set(mobile?9:compact?12.2:8,mobile?7.2:compact?9.6:6.3,mobile?12.4:compact?16.2:10.6);camera.lookAt(0,mobile?-.1:0,0);camera.updateProjectionMatrix();setState()}
new ResizeObserver(resize).observe(container);new IntersectionObserver(e=>{renderActive=e[0].isIntersecting},{rootMargin:'150px'}).observe(stage);
function animate(time){requestAnimationFrame(animate);const dt=Math.min((time-lastTime)/1000,.05)||0;lastTime=time;if(!renderActive||document.hidden)return;currentExplosion=reduceMotion?targetExplosion:THREE.MathUtils.lerp(currentExplosion,targetExplosion,1-Math.exp(-dt*7));for(const p of parts)p.position.copy(p.userData.home).addScaledVector(p.userData.delta,currentExplosion);guideMaterial.opacity=currentExplosion*.27;root.rotation.y=-.4+progress*.8+(reduceMotion?0:pointerX);root.rotation.z=reduceMotion?0:Math.sin(time*.00035)*.025;root.rotation.x=reduceMotion?0:pointerY;root.position.y=reduceMotion?0:Math.sin(time*.0008)*.045;const modelScale=1-currentExplosion*.13;root.scale.setScalar(modelScale);for(let i=0;i<propellers.length;i++)if(!reduceMotion)propellers[i].rotation.y+=dt*(currentExplosion>.7?.18:1.8)*(i%2?1:-1);renderer.render(scene,camera)}
resize();setState();requestAnimationFrame(animate);
}
