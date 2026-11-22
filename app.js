(() => {
'use strict';
const canvas = document.getElementById('scan-canvas');
const ctx = canvas.getContext('2d');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const assets = {
  ship: {category:'MARITIME ASSET', title:'A vessel.<br>Every perspective.', description:'A proposed 3D hull record with image-linked findings, repeatable locations, and before/after repair documentation.', label:'ship'},
  tower:{category:'CRITICAL INFRASTRUCTURE', title:'A structure.<br>A complete picture.', description:'A spatial record of elevated surfaces, supporting structures, and inspection context.', label:'water tower'},
  vehicle:{category:'MISSION EQUIPMENT', title:'Equipment.<br>In full dimension.', description:'Geometry and surface context for documentation, fit assessment, and engineering review.', label:'utility vehicle'}
};
let width=1,height=1,points=[],asset='ship',angle=-0.52,dragging=false,lastX=0,paused=reducedMotion,frame=0,lastTime=0,elapsed=0,visible=true;
const seed=(n)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
const add=(x,y,z,kind=0)=>points.push({x,y,z,kind,j:seed(points.length)});
function line(a,b,n=35,kind=0){for(let i=0;i<=n;i++){let t=i/n;add(a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t,kind)}}
function box(cx,cy,cz,sx,sy,sz,step=5){
 for(let x=-sx/2;x<=sx/2;x+=step)for(let z=-sz/2;z<=sz/2;z+=step){add(cx+x,cy+sy/2,cz+z);add(cx+x,cy-sy/2,cz+z)}
 for(let x=-sx/2;x<=sx/2;x+=step)for(let y=-sy/2;y<=sy/2;y+=step){add(cx+x,cy+y,cz-sz/2);add(cx+x,cy+y,cz+sz/2)}
 for(let z=-sz/2;z<=sz/2;z+=step)for(let y=-sy/2;y<=sy/2;y+=step){add(cx-sx/2,cy+y,cz+z);add(cx+sx/2,cy+y,cz+z)}
}
function makeAsset(type){points=[];
 if(type==='ship'){
  for(let x=-205;x<=205;x+=4){const u=(x+205)/410;const w=43*Math.pow(Math.sin(Math.PI*u),.36)*(x>90?1-(x-90)/160:1);for(let z=-w;z<=w;z+=4){add(x,19,z);if(Math.abs(z)>w-5)add(x,-17+15*Math.abs(z)/w,z*.86)}for(let y=-18;y<=19;y+=4){add(x,y,w*(.82+.18*(y+18)/37));add(x,y,-w*(.82+.18*(y+18)/37))}}
  box(-20,38,0,145,37,61,4);box(-38,66,0,72,24,52,4);box(-45,85,0,51,14,40,4);box(-87,69,0,22,48,25,4);box(76,29,0,32,20,30,4);box(-150,29,0,35,20,30,4);
  line([-40,91,0],[-40,150,0],45,1);line([-65,124,0],[-15,124,0],35,1);line([-40,139,-17],[-40,139,17],25,1);line([-74,92,-15],[-40,150,0],40,1);line([-10,92,15],[-40,150,0],40,1);
  for(let x=-170;x<165;x+=15){let w=41*Math.pow(Math.sin(Math.PI*(x+205)/410),.36)*(x>90?1-(x-90)/160:1);line([x,19,w],[x,29,w],5,1);line([x,19,-w],[x,29,-w],5,1)}
 } else if(type==='tower'){
  for(let a=0;a<Math.PI*2;a+=.055)for(let y=55;y<=135;y+=4){const r=65;add(Math.cos(a)*r,y,Math.sin(a)*r)}
  for(let a=0;a<Math.PI*2;a+=.045)for(let r=0;r<=65;r+=4){add(Math.cos(a)*r,136+16*(1-(r/65)**2),Math.sin(a)*r);add(Math.cos(a)*r,55-22*(1-(r/65)**2),Math.sin(a)*r)}
  const legs=[];for(let i=0;i<4;i++){let a=Math.PI/4+i*Math.PI/2;let top=[Math.cos(a)*58,51,Math.sin(a)*58],bottom=[Math.cos(a)*82,-115,Math.sin(a)*82];legs.push({top,bottom});for(let o=-2;o<=2;o+=2)line([top[0]+o,top[1],top[2]],[bottom[0]+o,bottom[1],bottom[2]],65,1)}
  for(let i=0;i<4;i++){const a=legs[i],b=legs[(i+1)%4];for(let t=0;t<3;t++){let u=t/3,v=(t+1)/3;let p=(leg,t)=>leg.top.map((n,j)=>n+(leg.bottom[j]-n)*t);line(p(a,u),p(b,v),45,1);line(p(b,u),p(a,v),45,1);line(p(a,v),p(b,v),30,1)}}
  line([0,151,0],[0,175,0],20,1);line([0,175,0],[17,175,0],15,1);
 } else {
  box(0,-10,0,225,49,91,4);box(-35,32,0,93,45,82,4);box(-48,65,0,73,22,77,4);box(73,25,0,68,27,85,4);box(-2,-39,0,190,9,72,4);
  for(let x of [-73,75])for(let z of [-48,48])for(let a=0;a<Math.PI*2;a+=.06)for(let d=-7;d<=7;d+=3){add(x+25*Math.cos(a),-37+25*Math.sin(a),z+d,1)}
  line([-74,77,0],[-74,126,0],35,1);for(let z of [-39,39]){line([-73,77,z],[-1,77,z],30,1);line([-73,77,z],[-83,57,z],20,1)}
 }
}
function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;let d=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(width*d);canvas.height=Math.round(height*d);ctx.setTransform(d,0,0,d,0,0);render()}
function project(x,y,z){const c=Math.cos(angle),s=Math.sin(angle);const rx=x*c-z*s,rz=x*s+z*c;const pitch=.47;let scale=Math.min(width/660,height/400);if(width<600)scale=Math.min(width/475,height/490);if(asset==='tower')scale*=.92;const centerX=width<600?width*.51:width*.58;const centerY=width<600?height*.62:height*.56;return{x:centerX+rx*scale,y:centerY+(-y*Math.cos(pitch)+rz*Math.sin(pitch))*scale,depth:rz*Math.cos(pitch)+y*Math.sin(pitch),scale}}
function drawLine(a,b,color,lw=.6){let p=project(...a),q=project(...b);ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}
function render(){
 ctx.clearRect(0,0,width,height);const ground=asset==='tower'?-118:-65;
 for(let n=-300;n<=300;n+=30){drawLine([n,ground,-180],[n,ground,180],'rgba(112,144,88,.1)');drawLine([-300,ground,n*.6],[300,ground,n*.6],'rgba(112,144,88,.1)')}
 const scanX=Math.sin(elapsed*.0006)*230;
 if(!reducedMotion){drawLine([scanX,ground,-125],[scanX,160,-125],'rgba(203,244,134,.1)');drawLine([scanX,160,-125],[scanX,160,125],'rgba(203,244,134,.1)');drawLine([scanX,160,125],[scanX,ground,125],'rgba(203,244,134,.1)');drawLine([scanX,ground,-125],[scanX,ground,125],'rgba(203,244,134,.35)')}
 const projected=points.map(p=>({...project(p.x,p.y,p.z),p})).sort((a,b)=>a.depth-b.depth);
 for(const q of projected){const proximity=Math.max(0,1-Math.abs(q.p.x-scanX)/32);const depthAlpha=.3+((q.depth+220)/440)*.45;ctx.fillStyle=q.p.kind?`rgba(218,243,186,${Math.min(.95,depthAlpha+.12)})`:`rgba(${Math.round(148+proximity*90)},${Math.round(186+proximity*55)},${Math.round(111+proximity*59)},${Math.min(.95,depthAlpha+proximity*.35)})`;const size=(q.p.kind?1.25:1.25+q.p.j*.4)*Math.min(q.scale,1.4);ctx.fillRect(q.x,q.y,size,size)}
 // A simple aerial capture path around the asset.
 ctx.strokeStyle='rgba(175,212,137,.22)';ctx.setLineDash([3,7]);ctx.lineWidth=.65;ctx.beginPath();for(let i=0;i<=80;i++){let a=i/80*Math.PI*2;let p=project(Math.cos(a)*255,ground,Math.sin(a)*135);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.stroke();ctx.setLineDash([]);
 // Illustrative mapping drone and capture rays; no recorded mission data.
 const orbit=elapsed*.00016+1.2, dx=Math.cos(orbit)*225, dz=Math.sin(orbit)*120, dy=asset==='tower'?170:145;
 const droneColor='rgba(222,247,191,.85)';
 drawLine([dx-14,dy,dz-12],[dx+14,dy,dz+12],droneColor,1);
 drawLine([dx+14,dy,dz-12],[dx-14,dy,dz+12],droneColor,1);
 drawLine([dx,dy-4,dz],[dx,dy+4,dz],droneColor,2);
 for(const ox of [-14,14])for(const oz of [-12,12]){ctx.strokeStyle=droneColor;ctx.lineWidth=.8;ctx.beginPath();for(let i=0;i<=20;i++){const a=i/20*Math.PI*2;const p=project(dx+ox+Math.cos(a)*9,dy,dz+oz+Math.sin(a)*9);i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y)}ctx.stroke()}
 drawLine([dx,dy-4,dz],[30,20,-30],'rgba(203,244,134,.10)');
 drawLine([dx,dy-4,dz],[-40,20,30],'rgba(203,244,134,.10)');
 drawLine([dx,dy-4,dz],[70,20,20],'rgba(203,244,134,.10)');
 const dp=project(dx,dy,dz);ctx.font='9px ui-monospace,monospace';ctx.fillStyle='rgba(188,214,164,.65)';ctx.fillText('CAPTURE PATH',dp.x+23,dp.y-10);
}

function animate(t){if(!lastTime)lastTime=t;const dt=Math.min(t-lastTime,40);lastTime=t;if(visible&&!paused&&!dragging){elapsed+=dt;angle+=dt*.000022}if(visible)render();frame=requestAnimationFrame(animate)}
function selectAsset(type,focus=false){if(!assets[type])return;asset=type;angle=type==='tower'?-.56:-.52;makeAsset(type);const a=assets[type];document.getElementById('asset-category').textContent=a.category;document.getElementById('asset-name').innerHTML=a.title;document.getElementById('asset-description').textContent=a.description;document.getElementById('scan-view').setAttribute('aria-labelledby','tab-'+type);canvas.setAttribute('aria-label',`Interactive illustrative 3D ${a.label} scan. Drag or use left and right arrow keys to rotate.`);document.querySelectorAll('[data-asset]').forEach(b=>{const active=b.dataset.asset===type;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;if(active&&focus)b.focus()});render()}
const tabs=[...document.querySelectorAll('[data-asset]')];tabs.forEach((b,i)=>{b.addEventListener('click',()=>selectAsset(b.dataset.asset));b.addEventListener('keydown',e=>{let j;if(e.key==='ArrowRight')j=(i+1)%tabs.length;else if(e.key==='ArrowLeft')j=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=tabs.length-1;else return;e.preventDefault();selectAsset(tabs[j].dataset.asset,true)})});
canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!dragging)return;angle+=(e.clientX-lastX)*.008;lastX=e.clientX;render()});const endDrag=()=>{dragging=false};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();angle+=e.key==='ArrowLeft'?-.1:.1;render()}});
const pause=document.getElementById('pause-scan');function updatePause(){pause.textContent=paused?'Resume motion':'Pause motion';pause.setAttribute('aria-pressed',String(paused))}pause.addEventListener('click',()=>{paused=!paused;updatePause()});updatePause();document.getElementById('reset-view').addEventListener('click',()=>{angle=-.52;elapsed=0;render()});
document.querySelectorAll('[data-select-asset]').forEach(b=>b.addEventListener('click',()=>{selectAsset(b.dataset.selectAsset);document.getElementById('mission').scrollIntoView({behavior:reducedMotion?'instant':'smooth'});document.getElementById('tab-'+b.dataset.selectAsset).focus({preventScroll:true})}));
const dialog=document.getElementById('pilot-dialog');document.getElementById('pilot-open').addEventListener('click',()=>dialog.showModal());document.querySelectorAll('.dialog-close,.dialog-done').forEach(b=>b.addEventListener('click',()=>dialog.close()));dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close()}});
new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting},{rootMargin:'100px'}).observe(canvas);document.addEventListener('visibilitychange',()=>{lastTime=0});makeAsset(asset);resize();frame=requestAnimationFrame(animate);
})();

// Scenario planning only: values are editable assumptions, not measured performance.
(() => {
const ids=['baseline-capture-hours','baseline-capture-crew','baseline-report-hours','baseline-report-crew','proposed-capture-hours','proposed-capture-crew','proposed-report-hours','proposed-report-crew'];
const inputs=ids.map(id=>document.getElementById(id));
const defaults=[8,2,4,1,3,2,2,1];
const byId=id=>document.getElementById(id);
const format=n=>Number(n.toFixed(1)).toLocaleString('en-US');
function update(){
 const valid=inputs.every(input=>input.value!==''&&input.checkValidity());
 byId('impact-invalid').hidden=valid;
 if(!valid){byId('impact-percent').textContent='—';byId('impact-person-hours').textContent='—';byId('impact-task-hours').textContent='—';byId('impact-comparison').textContent='Check the scenario inputs.';byId('impact-time-detail').textContent='';return}
 const [bc,bn,br,bm,pc,pn,pr,pm]=inputs.map(input=>Number(input.value));
 const base=bc*bn+br*bm, proposed=pc*pn+pr*pm, labor=base-proposed, time=bc+br-pc-pr;
 const percent=base>0?Math.abs(labor/base*100):null;
 byId('impact-rate-label').textContent=labor<0?'ILLUSTRATIVE LABOR INCREASE':'POTENTIAL LABOR REDUCTION';
 byId('impact-percent').innerHTML=percent===null?'—':`${format(percent)}<span>%</span>`;
 byId('impact-comparison').textContent=`${format(base)} → ${format(proposed)} person-hours per asset`;
 byId('impact-person-hours').textContent=format(Math.abs(labor));byId('impact-person-label').textContent=labor<0?'extra person-hours':'person-hours saved';
 byId('impact-task-hours').textContent=format(Math.abs(time));byId('impact-task-label').textContent=time<0?'extra task-hours':'task-hours saved';
 byId('impact-time-detail').textContent=`Sequential capture + reporting: ${format(bc+br)} → ${format(pc+pr)} hours.${base===0?' A nonzero baseline is needed for a percentage.':''}`;
}
inputs.forEach(input=>input.addEventListener('input',update));
byId('reset-impact').addEventListener('click',()=>{inputs.forEach((input,i)=>input.value=defaults[i]);update()});update();
})();
