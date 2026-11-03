'use strict';
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='portfolio-preview'||!Array.isArray(event.data.projects))return;
 const orbit=document.getElementById('orbit'),label=document.getElementById('hover-label');
 orbit.replaceChildren();
 const list=event.data.projects;
 list.forEach((p,i)=>{
  const angle=(-100+i*360/list.length)*Math.PI/180;
  const card=document.createElement('button');card.className='orbit-card';
  card.style.setProperty('--x','calc(var(--radius-x) * '+Math.cos(angle).toFixed(5)+')');
  card.style.setProperty('--y','calc(var(--radius-y) * '+Math.sin(angle).toFixed(5)+')');
  card.style.setProperty('--angle',(-10+i*360/list.length)+'deg');
  card.setAttribute('aria-label',p.en||p.title||'作品');
  const image=document.createElement('img');image.src=p.src;image.alt=p.title||'';card.append(image);
  card.addEventListener('mouseenter',()=>label.textContent=p.en);
  card.addEventListener('mouseleave',()=>label.textContent='');
  card.addEventListener('focus',()=>label.textContent=p.en);
  card.addEventListener('blur',()=>label.textContent='');
  orbit.append(card);
 });
 const animation=orbit.getAnimations().find(a=>a.animationName==='orbit-turn');
 if(animation)orbit.querySelectorAll('img').forEach(image=>image.getAnimations().forEach(a=>a.currentTime=animation.currentTime));
});
