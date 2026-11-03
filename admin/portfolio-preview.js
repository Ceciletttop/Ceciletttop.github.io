
function applyPortfolioText(text={}){
 const heading=document.querySelector('.hero-heading h1');if(!heading)return;
 let title=heading.querySelector('.hero-title-text');
 if(!title){title=document.createElement('span');title.className='hero-title-text';title.style.color='inherit';const node=heading.firstChild;title.textContent=node?.textContent||'';if(node)node.replaceWith(title);else heading.prepend(title);}
 const nodes={title,subtitle:heading.querySelector('.hero-bottom-line>span:not(.hero-year)'),year:heading.querySelector('.hero-year')};
 const defaults={title:'Portfolio',subtitle:'Creativity',year:'2026'};
 for(const key of Object.keys(nodes)){if(nodes[key]){nodes[key].textContent=String(text[key]??defaults[key]);nodes[key].dataset.heroText=key;}}
 return nodes;
}
'use strict';
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='portfolio-preview'||!Array.isArray(event.data.projects))return;
 applyPortfolioText(event.data.text);enableTextEditing();
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

function enableTextEditing(){
 document.querySelectorAll('[data-hero-text]').forEach(el=>{
 el.tabIndex=0;el.setAttribute('aria-label','编辑'+({title:'主标题',subtitle:'副标题',year:'年份'}[el.dataset.heroText]));
 el.ondblclick=()=>{el.contentEditable='plaintext-only';el.focus();};
 el.onkeydown=event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();if(el.isContentEditable)el.blur();else{el.contentEditable='plaintext-only';el.focus();}}};
 el.oninput=()=>{parent.postMessage({type:'portfolio-text-edit',key:el.dataset.heroText,value:el.textContent},location.origin);};
 el.onblur=()=>{el.contentEditable='false';};
 });
}
window.addEventListener('message',event=>{
 if(event.source!==parent||event.origin!==location.origin||event.data?.type!=='portfolio-text')return;
 applyPortfolioText(event.data.text);enableTextEditing();
});
