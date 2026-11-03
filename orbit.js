(()=>{'use strict';const projects=window.PORTFOLIO_PROJECTS,orbit=document.querySelector('#orbit'),grid=document.querySelector('#work-grid'),dialog=document.querySelector('#project-dialog'),content=document.querySelector('#project-content'),label=document.querySelector('#hover-label');let category='all';const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const match={all:()=>true,...Object.fromEntries(window.SITE_CONTENT.categories.map(c=>[c.id,p=>(p.categoryIds||[]).includes(c.id)]))};document.querySelector('.category-list').innerHTML='<button data-category="all" aria-pressed="true">All work</button>'+window.SITE_CONTENT.categories.map(c=>`<button data-category="${escape(c.id)}" aria-pressed="false">${escape(c.name)}</button>`).join('');
let onscreen=true;function updatePause(){orbit.classList.toggle('is-paused',document.hidden||dialog.open||!onscreen);}function syncOrbit(){const parent=orbit.getAnimations().find(a=>a.animationName==='orbit-turn');if(parent)orbit.querySelectorAll('.orbit-card img').forEach(card=>card.getAnimations().forEach(a=>{if(a.animationName==='orbit-image-upright')a.currentTime=parent.currentTime;}));updatePause();}
new IntersectionObserver(entries=>{onscreen=entries[0].isIntersecting;updatePause();},{threshold:.05}).observe(document.querySelector('.orbit-stage'));new MutationObserver(updatePause).observe(dialog,{attributes:true,attributeFilter:['open']});document.addEventListener('visibilitychange',updatePause);
function layoutGallery(){
  const originalCards=[...grid.querySelectorAll('.work-card')],style=getComputedStyle(grid);
  originalCards.forEach((card,index)=>{if(!card.hasAttribute('data-gallery-order'))card.dataset.galleryOrder=index;});
  // Wide, shallow covers follow taller covers; preserve the chosen order within each group.
  const isShallow=card=>(Number(card.style.getPropertyValue('--image-ratio'))||1)>=1.4;
  const cards=[...originalCards].sort((a,b)=>Number(isShallow(a))-Number(isShallow(b))||Number(a.dataset.galleryOrder)-Number(b.dataset.galleryOrder));
  if(cards.some((card,index)=>card!==originalCards[index]))cards.forEach(card=>grid.append(card));
  const width=grid.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight),gap=parseFloat(style.columnGap)||14;
  if(width<=0)return;
  const columns=Number(style.getPropertyValue('--work-columns'))||6;
  const cardWidth=cards.length===1?Math.min(width,window.innerWidth/4):(width-gap*(columns-1))/columns;
  const heights=Array(columns).fill(0);
  cards.forEach(card=>card.style.setProperty('--card-width',cardWidth+'px'));
  cards.forEach(card=>{
    const shortest=Math.min(...heights),column=heights.findIndex(height=>height<=shortest+2);
    card.style.left=(parseFloat(style.paddingLeft)+column*(cardWidth+gap))+'px';
    card.style.top=(parseFloat(style.paddingTop)+heights[column])+'px';
    heights[column]+=card.getBoundingClientRect().height+gap;
  });
  grid.style.height=(Math.max(0,...heights)-(cards.length?gap:0)+parseFloat(style.paddingTop)+parseFloat(style.paddingBottom))+'px';
}new ResizeObserver(layoutGallery).observe(grid);
document.fonts.ready.then(layoutGallery);
grid.addEventListener('load',event=>{
  const img=event.target,card=img.closest?.('.work-card');
  if(card&&img.naturalWidth&&img.naturalHeight){card.style.setProperty('--image-ratio',img.naturalWidth/img.naturalHeight);layoutGallery();}
},true);
function bindProjectButtons(scope){scope.querySelectorAll('[data-project]').forEach(button=>{const p=projects.find(p=>p.id===button.dataset.project);button.addEventListener('click',()=>openProject(p));if(button.classList.contains('orbit-card')){button.addEventListener('mouseenter',()=>{label.textContent=p.en;});button.addEventListener('mouseleave',()=>{label.textContent='';});button.addEventListener('focus',()=>{label.textContent=p.en;});button.addEventListener('blur',()=>{label.textContent='';});}});}
function renderOrbit(){const ring=window.SITE_CONTENT.selected.map(id=>projects.find(p=>p.id===id)).filter(Boolean);orbit.innerHTML=ring.map((p,i)=>{const angle=(-100+i*360/ring.length)*Math.PI/180;return `<button class="orbit-card" data-project="${p.id}" style="--x:calc(var(--radius-x) * ${Math.cos(angle).toFixed(5)});--y:calc(var(--radius-y) * ${Math.sin(angle).toFixed(5)});--angle:${-10+i*360/ring.length}deg" aria-label="查看作品：${escape(p.en)}"><img src="${escape(p.orbitCover||p.coverThumb||p.cover)}" alt="${escape(p.title)}" decoding="async"></button>`}).join('');bindProjectButtons(orbit);syncOrbit();}
function render(){const list=projects.filter(match[category]);grid.innerHTML=list.map(p=>{const image=p.images.find(i=>i.src===p.cover),ratio=image?image.width/image.height:1;return `<button class="work-card" data-project="${p.id}" style="--image-ratio:${ratio}" aria-label="查看作品：${escape(p.en)}"><span class="work-image"><img src="${p.cover}" alt="${escape(p.title)}" loading="lazy" ${image?`width="${image.width}" height="${image.height}"`:''}></span><span class="project-arrow" aria-hidden="true">↗</span><span class="work-caption"><strong>${escape(p.en.charAt(0).toUpperCase()+p.en.slice(1).toLowerCase())}</strong><small>${escape(p.title)}</small></span></button>`;}).join('');bindProjectButtons(grid);layoutGallery();}
function openProject(p){lastProjectButton=document.activeElement;content.innerHTML=`<iframe class="detail-frame" src="detail.html#project/${p.id}" title="${escape(p.en)} — 作品详情"></iframe>`;dialog.showModal();dialog.querySelector('iframe').focus();}window.addEventListener('message',e=>{if(e.origin===location.origin&&e.source===dialog.querySelector('iframe')?.contentWindow&&e.data?.type==='cecile-close-detail')dialog.close();});dialog.addEventListener('close',()=>{content.replaceChildren();lastProjectButton?.focus();});let lastProjectButton;dialog.addEventListener('cancel',()=>setMenu(false));
document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{category=button.dataset.category;document.querySelectorAll('[data-category]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();}));
const toggle=document.querySelector('#menu-toggle'),menu=document.querySelector('#main-menu');function setMenu(open){menu.hidden=!open;toggle.setAttribute('aria-expanded',String(open));toggle.querySelector('span:last-child').textContent=open?'Close':'Menu';}toggle.addEventListener('click',()=>setMenu(menu.hidden));menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenu(false)));document.addEventListener('pointerdown',e=>{if(!e.target.closest('.menu-group'))setMenu(false);});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){setMenu(false);toggle.focus();}});
let scheduled=false;function progress(){const max=document.documentElement.scrollHeight-innerHeight,value=max>0?Math.round(scrollY/max*100):0;document.querySelector('.scroll-progress').textContent=value+'%';scheduled=false;}window.addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(progress);}},{passive:true});window.addEventListener('resize',progress);renderOrbit();render();progress();})();
