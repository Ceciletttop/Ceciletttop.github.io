(() => {
  'use strict';
  const projects = window.PORTFOLIO_PROJECTS;
  const root = document.querySelector('main');
  const dialog = document.querySelector('#media-dialog');
  const dialogContent = dialog.querySelector('.dialog-content');
  const closeProject = document.querySelector('.close-project');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const phone = () => false;
  const esc = text => String(text).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  let activeProject = null, activeIndex = 0, previousScene = 'home', cleanup = () => {}, currentMedia = [], gallery = null;
  let homeFilter = null, workMenuOpen = false;
  const workTrigger=document.querySelector('#nav-work');
  const workMenu=document.querySelector('#work-category-menu');
  let applySceneCategory=null;
  function setWorkMenu(open){
    workMenuOpen=open;workTrigger.setAttribute('aria-expanded',String(open));workTrigger.setAttribute('aria-label',open?'关闭作品分类':'打开作品分类');
    workMenu.hidden=!open;root.inert=open;document.querySelector('.brand').inert=open;document.body.classList.toggle('work-menu-open',open);
    if(open)workMenu.querySelector('.category-button')?.focus();else if(workMenu.contains(document.activeElement))workTrigger.focus();
  }
  const homeCategories = [{id:'all',label:'All',matches:()=>true},{id:'ip',label:'IP Design',matches:p=>p.tags.includes('character')},{id:'video',label:'Video Design',matches:p=>p.videos.length>0},{id:'poster',label:'Poster Design',matches:p=>['planet','vesper','identity'].includes(p.id)}];
  workMenu.innerHTML=`<div class="overlay-menu-content"><p class="overlay-menu-eyebrow">SELECTED WORK</p><div class="overlay-menu-rows">${homeCategories.map(c=>{const count=projects.filter(c.matches).length;return `<button type="button" class="category-button overlay-category" data-category="${c.id}" aria-pressed="false" aria-label="${c.label}, ${count} 个作品"><span class="category-label">${c.label}</span><span class="category-count"><span class="count-value">${String(count).padStart(2,'0')}</span><span>projects</span></span></button>`;}).join('')}</div></div>`;
  const remembered = {home:new Map(),work:new Map(),homeMobile:new Map(),workMobile:new Map()};
  const layout = {
    home:[[38,27,7],[16,31,-8],[65,28,-5],[23,53,7],[47,53,-6],[73,66,8],[59,51,4]],
    mobile:[[25,37,-9],[69,37,7],[18,56,5],[50,56,-7],[82,56,-5],[27,75,8],[70,75,2]],
    work:[[17,30,-4],[38,30,3],[59,30,-3],[78,30,4],[26,59,3],[48,59,-3],[70,59,4]],
    workMobile:[[25,37,-4],[69,37,4],[18,56,3],[50,56,-4],[82,56,-4],[27,75,4],[70,75,2]]
  };
  function announce(text){document.querySelector('#announcer').textContent=text;}
  function pauseMedia(scope=document){scope.querySelectorAll('video').forEach(v=>v.pause());}
  function mediaFor(p){return [...p.videos.map(v=>({...v,type:'video',thumb:p.coverThumb})),...p.images.map(i=>({...i,type:'image'}))];}
  function titleSVG(){return `<h1 class="scene-title"><span class="sr-only">Creative Portfolio</span><svg aria-hidden="true" viewBox="0 0 690 212"><defs>
    <g id="glass-title-shape"><text x="2" y="92" font-size="99" textLength="570" lengthAdjust="spacingAndGlyphs">CREATIVE</text><text x="2" y="194" font-size="99" textLength="670" lengthAdjust="spacingAndGlyphs">PORTFOLIO</text></g>
    <linearGradient id="glass-face" x1="0" y1="0" x2=".55" y2="1"><stop stop-color="#ffffff" stop-opacity=".32"/><stop offset=".25" stop-color="#e8ddff" stop-opacity=".13"/><stop offset=".54" stop-color="#c8c2f4" stop-opacity=".10"/><stop offset=".76" stop-color="#ffffff" stop-opacity=".28"/><stop offset="1" stop-color="#cceddf" stop-opacity=".16"/></linearGradient>
    <linearGradient id="glass-edge" x1="0" y1="0" x2=".4" y2="1"><stop stop-color="#ffffff"/><stop offset=".22" stop-color="#f8f4ff"/><stop offset=".42" stop-color="#9791c0" stop-opacity=".65"/><stop offset=".58" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".82" stop-color="#d8f4e8" stop-opacity=".9"/><stop offset="1" stop-color="#8b88b5" stop-opacity=".65"/></linearGradient>
    <linearGradient id="glass-inner" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9284b6" stop-opacity=".5"/><stop offset=".25" stop-color="#ffffff" stop-opacity=".9"/><stop offset=".52" stop-color="#e6e0ff" stop-opacity=".15"/><stop offset=".8" stop-color="#86ac9c" stop-opacity=".4"/><stop offset="1" stop-color="#ffffff" stop-opacity=".9"/></linearGradient>
    <filter id="glass-shadow" x="-15%" y="-30%" width="135%" height="170%"><feGaussianBlur stdDeviation="2"/></filter>
    <filter id="glass-rounding" x="-10%" y="-20%" width="125%" height="145%"><feMorphology in="SourceAlpha" operator="erode" radius="2.2" result="inset"/><feComposite in="SourceAlpha" in2="inset" operator="out" result="rim"/><feGaussianBlur in="rim" stdDeviation=".6" result="soft-rim"/><feSpecularLighting in="soft-rim" surfaceScale="2.6" specularConstant="1" specularExponent="24" lighting-color="#ffffff" result="specular"><fePointLight x="-180" y="-250" z="300"/></feSpecularLighting><feComposite in="specular" in2="rim" operator="in"/></filter>
    </defs><g class="glass-lettering" stroke-linejoin="round">
    <use href="#glass-title-shape" class="glass-cast" transform="translate(1.7 3)"/>
    <use href="#glass-title-shape" class="glass-depth" transform="translate(1.2 1.8)"/>
    <use href="#glass-title-shape" class="glass-body"/>
    <use href="#glass-title-shape" class="glass-inner" transform="translate(.6 .7)"/>
    <use href="#glass-title-shape" class="glass-rim"/>
    <use href="#glass-title-shape" class="glass-light"/>
    </g></svg></h1>`;}

  function paperTitle(text){return text.toLowerCase().split(' ').map((word,index)=>index&&/^(a|an|the|and|or|of|in|on|to|for)$/.test(word)?word:word.charAt(0).toUpperCase()+word.slice(1)).join(' ');}
  function paperHTML(p,index){return `<a class="polaroid" href="#project/${p.id}" data-project="${p.id}" aria-label="Open project: ${esc(p.en)} — ${esc(p.title)}" style="--delay:${index*.065}s"><span class="picture"><img src="${p.coverThumb}" alt="${esc(p.title)}" draggable="false" width="400" height="400"></span><span class="paper-name">${esc(paperTitle(p.en))}</span></a>`;}
  function renderScene(mode){
    const work=mode==='work';previousScene=mode;
    root.innerHTML=`<section class="home-scene ${work?'work-scene':''}" aria-label="${work?'All projects':'Creative Portfolio'}"><div class="scene-cards" id="home-project-cards">${projects.map(paperHTML).join('')}</div>${titleSVG()}<span class="scene-hint">CLICK TO OPEN · HOLD TO DRAG</span></section>`;
    const scene=root.querySelector('.scene-cards'), cards=[...scene.querySelectorAll('.polaroid')];
    let state=[],frame=0,drag=null,pending=null,holdTimer=0,z=10,disposed=false,ignoreClickUntil=0,lastTick=0,windPointer=null;
    const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
    function position(){
      const bounds=scene.getBoundingClientRect();
      const positions=phone()?(work?layout.workMobile:layout.mobile):(work?layout.work:layout.home);
      state=cards.map((el,i)=>{
        const saved=remembered[mode+(phone()?'Mobile':'')].get(projects[i].id), pos=positions[i];
        const s={el,x:(saved?.[0]??pos[0])/100*bounds.width,y:(saved?.[1]??pos[1])/100*bounds.height,r:saved?.[2]??pos[2],vx:0,vy:0,vr:0,tiltX:0,tiltY:0,hovered:false,lift:0,grabX:0,grabY:0,w:el.offsetWidth||parseFloat(getComputedStyle(el).width),h:el.offsetHeight||(parseFloat(getComputedStyle(el).width)/.82)};
        el.style.zIndex=++z;
        paint(s);return s;
      });
    }
    function paint(s){s.el.style.left=`${s.x}px`;s.el.style.top=`${s.y}px`;s.el.style.setProperty('--rotation',`${s.r}deg`);s.el.style.setProperty('--tilt-x',`${s.tiltX}deg`);s.el.style.setProperty('--tilt-y',`${s.tiltY}deg`);s.el.style.setProperty('--grab-x',`${s.grabX}px`);s.el.style.setProperty('--grab-y',`${s.grabY}px`);s.el.style.setProperty('--grab-scale',1+s.lift*.085);}
    function remember(s){if(homeFilter)return;const b=scene.getBoundingClientRect();remembered[mode+(phone()?'Mobile':'')].set(s.el.dataset.project,[s.x/b.width*100,s.y/b.height*100,s.r]);}
    function tick(now){
      const step=lastTick?Math.min(2,(now-lastTick)/(1000/60)):1;lastTick=now;
      let moving=false;const b=scene.getBoundingClientRect();
      for(const s of state){
        if(s.el.hidden)continue;
        const target=drag?.s===s?1:0;
        if(Math.abs(target-s.lift)>.001){s.lift+=(target-s.lift)*(1-Math.pow(.76,step));moving=true;}else s.lift=target;
        if(drag?.s===s||pending?.s===s){paint(s);continue;}
        if(s.hovered){s.vx*=Math.pow(.4,step);s.vy*=Math.pow(.4,step);s.vr*=Math.pow(.35,step);}

        if(Math.abs(s.vx)+Math.abs(s.vy)+Math.abs(s.vr)+Math.abs(s.tiltX)+Math.abs(s.tiltY)<.045){s.vx=s.vy=s.vr=s.tiltX=s.tiltY=0;s.el.classList.remove('wind-blown');paint(s);continue;}moving=true;
        s.x+=s.vx*step*(s.hovered?.08:1);s.y+=s.vy*step*(s.hovered?.08:1);s.r+=s.vr*step*(s.hovered?.08:1);s.vx*=Math.pow(.92,step);s.vy*=Math.pow(.92,step);s.vr*=Math.pow(.88,step);s.tiltX*=Math.pow(.84,step);s.tiltY*=Math.pow(.84,step);
        const minX=b.width*.045+s.w/2,maxX=b.width*.955-s.w/2,minY=b.height*(phone()?.265:.11)+s.h/2,maxY=b.height*.93-s.h/2;
        if(s.x<minX){s.x=minX;s.vx=Math.abs(s.vx)*.45;}if(s.x>maxX){s.x=maxX;s.vx=-Math.abs(s.vx)*.45;}
        if(s.y<minY){s.y=minY;s.vy=Math.abs(s.vy)*.45;}if(s.y>maxY){s.y=maxY;s.vy=-Math.abs(s.vy)*.45;}
        s.r=Math.max(-24,Math.min(24,s.r));paint(s);remember(s);
      }
      frame=moving&&!disposed?requestAnimationFrame(tick):0;if(!frame)lastTick=0;
    }
    const startTick=()=>{if(!frame&&!reduceMotion.matches)frame=requestAnimationFrame(tick);};
    function moveHeld(d,clientX,clientY,now){
      const b=scene.getBoundingClientRect(),scaleX=b.width/(scene.clientWidth||b.width),scaleY=b.height/(scene.clientHeight||b.height);
      const dx=clientX-d.startX,dy=clientY-d.startY,dt=Math.max(8,now-d.time),s=d.s;
      d.moved=d.moved||Math.hypot(dx,dy)>6;
      // Keep the original grab point fixed, including movement during the hold delay.
      // Rotation and tilt stay fixed; pickup scales around the grab point. Constrain only after release.
      s.x=d.originX+dx/scaleX;s.y=d.originY+dy/scaleY;
      s.vx=(clientX-d.lastX)/scaleX/dt*16;s.vy=(clientY-d.lastY)/scaleY/dt*16;
      d.lastX=clientX;d.lastY=clientY;d.time=now;paint(s);
    }
    function grabOffset(s,e){
      // Invert the rendered plane (including rotation and perspective), so scaling
      // for pickup happens around the exact point beneath the pointer.
      const style=getComputedStyle(s.el),m=new DOMMatrix(style.transform),o=style.transformOrigin.split(' ').map(parseFloat),ox=o[0],oy=o[1];
      const project=(x,y)=>{const w=m.m14*x+m.m24*y+m.m44;return[(m.m11*x+m.m21*y+m.m41)/w+ox,(m.m12*x+m.m22*y+m.m42)/w+oy];};
      const corners=[[0,0],[s.w,0],[0,s.h],[s.w,s.h]].map(([x,y])=>project(x-ox,y-oy)),rect=s.el.getBoundingClientRect();
      const x=e.clientX-rect.left+Math.min(...corners.map(p=>p[0]))-ox,y=e.clientY-rect.top+Math.min(...corners.map(p=>p[1]))-oy;
      const a=m.m11-x*m.m14,b=m.m21-x*m.m24,c=m.m12-y*m.m14,d=m.m22-y*m.m24,u=x*m.m44-m.m41,v=y*m.m44-m.m42,det=a*d-b*c;
      return Math.abs(det)>1e-8?[(u*d-b*v)/det,(a*v-u*c)/det]:[0,0];
    }
    const onResize=()=>{if(!drag&&!pending){state.forEach(s=>s.reflowAnimation?.cancel());position();applyCategory(false);}};
    const onWind=e=>{
      if(e.pointerType!=='mouse'||e.buttons||drag||pending||reduceMotion.matches)return;
      const now=performance.now(),b=scene.getBoundingClientRect(),x=e.clientX-b.left,y=e.clientY-b.top,prev=windPointer;
      windPointer={x,y,time:now};if(!prev||now-prev.time>140)return;
      const dt=Math.max(8,now-prev.time),vx=clamp((x-prev.x)/dt*16,-25,25),vy=clamp((y-prev.y)/dt*16,-25,25);
      if(Math.hypot(vx,vy)<.15)return;
      let affected=false;
      for(const s of state){
        if(s.el.hidden||s.hovered||s.reflowAnimation?.playState==='running')continue;
        const dx=x-s.x,dy=y-s.y,distance=Math.hypot(dx/(s.w*.95),dy/(s.h*.9));if(distance>1.4)continue;
        const force=Math.pow(1-distance/1.4,2);affected=true;
        s.vx=clamp(s.vx+vx*force*.16,-9,9);s.vy=clamp(s.vy+vy*force*.16,-9,9);
        s.vr=clamp(s.vr+(dx*vy-dy*vx)/Math.max(s.w,s.h)*force*.045,-1.5,1.5);
        s.tiltX=clamp(s.tiltX-vy*force*.32,-11,11);s.tiltY=clamp(s.tiltY+vx*force*.32,-11,11);
        s.el.classList.add('wind-blown');
      }
      if(affected)startTick();
    };
    window.addEventListener('resize',onResize);
    window.addEventListener('pointermove',onWind,{passive:true});
    cards.forEach((el,i)=>{
      const p=projects[i];let preview;
      el.addEventListener('click',e=>{if(e.detail!==0&&performance.now()<ignoreClickUntil)e.preventDefault();});
      el.addEventListener('dragstart',e=>e.preventDefault());
      el.addEventListener('focus',()=>{el.style.zIndex=++z;});
      el.addEventListener('pointerenter',()=>{
        const s=state[i];s.hovered=true;s.vx*=.1;s.vy*=.1;s.vr*=.1;
        el.style.zIndex=++z;startTick();
        if(p.videos.length&&!reduceMotion.matches&&matchMedia('(hover:hover)').matches){
          if(!preview){preview=document.createElement('video');preview.src=p.videos[0].src;preview.muted=true;preview.loop=true;preview.playsInline=true;preview.preload='none';preview.addEventListener('playing',()=>preview.classList.add('ready'));el.querySelector('.picture').append(preview);}
          preview.play().catch(()=>{});
        }
      });
      el.addEventListener('pointerleave',()=>{state[i].hovered=false;if(preview){preview.pause();preview.classList.remove('ready');}});
      el.addEventListener('pointerdown',e=>{
        if(e.button!==0||!e.isPrimary||pending||drag)return;
        const s=state[i];s.vx=0;s.vy=0;s.vr=0;windPointer=null;
        // Retain an existing pickup anchor until its landing animation finishes.
        if(s.lift<.001)[s.grabX,s.grabY]=grabOffset(s,e);
        paint(s);
        pending={s,pointer:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),originX:s.x,originY:s.y,moved:false};
        el.classList.add('grab-pending');el.setPointerCapture(e.pointerId);
        holdTimer=setTimeout(()=>{
          if(!pending||pending.s!==s||disposed)return;
          drag=pending;pending=null;
          el.style.zIndex=++z;el.classList.add('dragging');el.classList.remove('grab-pending');s.el.classList.remove('wind-blown');
          moveHeld(drag,drag.lastX,drag.lastY,performance.now());startTick();
        },160);
      });
      el.addEventListener('pointermove',e=>{
        if(pending?.s===state[i]&&e.pointerId===pending.pointer){pending.lastX=e.clientX;pending.lastY=e.clientY;pending.moved=pending.moved||Math.hypot(e.clientX-pending.startX,e.clientY-pending.startY)>6;return;}
        if(!drag||drag.s!==state[i]||e.pointerId!==drag.pointer)return;
        moveHeld(drag,e.clientX,e.clientY,performance.now());
      });
      const release=e=>{
        if(pending?.s===state[i]&&e.pointerId===pending.pointer){clearTimeout(holdTimer);el.classList.remove('grab-pending');if(pending.moved||e.type==='pointercancel')ignoreClickUntil=performance.now()+450;pending=null;return;}
        if(!drag||drag.s!==state[i]||e.pointerId!==drag.pointer)return;const d=drag;drag=null;clearTimeout(holdTimer);el.classList.remove('dragging');ignoreClickUntil=performance.now()+450;
        if(d.moved){if(performance.now()-d.time>90){d.s.vx=0;d.s.vy=0;}d.s.vx=Math.max(-22,Math.min(22,d.s.vx));d.s.vy=Math.max(-22,Math.min(22,d.s.vy));d.s.vr=d.s.vx*.04;const b=scene.getBoundingClientRect();d.s.x=clamp(d.s.x,b.width*.045+d.s.w/2,b.width*.955-d.s.w/2);d.s.y=clamp(d.s.y,b.height*(phone()?.265:.11)+d.s.h/2,b.height*.93-d.s.h/2);paint(d.s);remember(d.s);}startTick();
      };
      el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);
      el.addEventListener('lostpointercapture',release);
    });
    function applyCategory(animate=true){
      const category=homeCategories.find(c=>c.id===homeFilter);
      state.forEach((s,i)=>{const hidden=!!category&&!category.matches(projects[i]);s.el.hidden=hidden;if(hidden){s.hovered=false;s.vx=s.vy=s.vr=0;s.el.querySelectorAll('video').forEach(v=>{v.pause();v.classList.remove('ready');});}});
      const bounds=scene.getBoundingClientRect(),visible=state.filter(s=>!s.el.hidden);
      const arrangements={
        3:[[33,40,-7],[51,35,4],[69,42,-5]],
        4:[[27,39,-7],[43,32,5],[59,40,-4],[75,34,6]],
        6:[[29,29,-7],[49,27,4],[69,30,-5],[29,60,5],[49,59,-6],[69,61,4]]
      };
      const slots=arrangements[visible.length]||visible.map((_,i)=>[25+(i%3)*21,29+Math.floor(i/3)*31,i%2?5:-5]);
      state.forEach((s,i)=>{
        const computed=getComputedStyle(s.el),from={left:computed.left,top:computed.top};
        s.reflowAnimation?.cancel();
        s.vx=s.vy=s.vr=s.tiltX=s.tiltY=s.lift=s.grabX=s.grabY=0;
        if(s.el.hidden)return;
        const saved=!category&&remembered[mode+(phone()?'Mobile':'')].get(projects[i].id);
        const pos=category?slots[visible.indexOf(s)]:(saved||layout[work?'work':'home'][i]);
        s.x=pos[0]/100*bounds.width;s.y=pos[1]/100*bounds.height;s.r=pos[2];paint(s);
        if(animate&&!reduceMotion.matches)s.reflowAnimation=s.el.animate([from,{left:s.el.style.left,top:s.el.style.top}],{duration:520,easing:'cubic-bezier(.2,.75,.2,1)'});
      });
      workMenu.querySelectorAll('.category-button').forEach(b=>b.setAttribute('aria-pressed',String(category?b.dataset.category===homeFilter:b.dataset.category==='all')));
      const count=cards.filter(card=>!card.hidden).length;
      announce(`${category?category.label:'All projects'}，${count} 个作品。${category?'再次点击当前分类显示全部。':''}`);
    }
    applySceneCategory=applyCategory;
    position();applyCategory(false);cleanup=()=>{state.forEach(s=>s.reflowAnimation?.cancel());disposed=true;clearTimeout(holdTimer);cancelAnimationFrame(frame);pending=drag=null;window.removeEventListener('resize',onResize);window.removeEventListener('pointermove',onWind);};
  }
  function renderProject(p){
    activeProject=p;currentMedia=mediaFor(p);activeIndex=0;
    root.innerHTML=`<article class="project-scene route-enter" aria-label="${esc(p.title)}"><header class="project-intro"><h1 class="project-title">${esc(p.en.charAt(0).toUpperCase()+p.en.slice(1).toLowerCase())}</h1><div class="project-copy"><p>${esc(p.summary)}</p><div class="project-meta"><span>${esc(p.category)}</span>${p.videos.length?'<span>VIDEO</span>':''}<span>${p.images.length} IMAGES</span></div></div></header><div class="media-stage" aria-label="Project images and videos" tabindex="0"></div><div class="project-controls"><div class="stage-controls"><button class="round-control media-prev" aria-label="Previous media">←</button><span class="media-count" aria-live="polite"></span><button class="round-control media-next" aria-label="Next media">→</button></div><button class="gallery-play" aria-label="Pause project videos">Ⅱ</button></div></article>`;
    root.querySelector('.media-prev').onclick=()=>selectMedia(activeIndex-1);
    root.querySelector('.media-next').onclick=()=>selectMedia(activeIndex+1);
    gallery=createGallery(root.querySelector('.media-stage'));
    cleanup=()=>{gallery?.destroy();gallery=null;};
    selectMedia(0);
  }
  function createGallery(stage){
    const gap=()=>phone()?18:28,slides=[],centers=[];let widths=[],period=0,offset=0,target=null,frame=0,lastFrame=0,held=null,ignoreUntil=0,disposed=false,paused=reduceMotion.matches,expanded=false,returnState=null,momentum=0;
    const playButton=root.querySelector('.gallery-play'),countElement=root.querySelector('.media-count'),controls=root.querySelector('.stage-controls');
    const wrap=x=>((x+period/2)%period+period)%period-period/2;
    currentMedia.forEach((m,i)=>{
      const slide=document.createElement('div');slide.className='media-slide gallery-card';slide.dataset.media=i;slide.tabIndex=0;slide.setAttribute('role','button');slide.setAttribute('aria-label',`View ${m.label} full screen`);
      const media=document.createElement(m.type==='video'?'video':'img');
      media.draggable=false;
      if(m.type==='video'){media.muted=true;media.defaultMuted=true;media.loop=true;media.playsInline=true;media.preload='none';media.poster=m.poster||activeProject.coverThumb;media.addEventListener('loadedmetadata',()=>{if(!disposed&&media.videoWidth&&media.videoHeight&&(m.width!==media.videoWidth||m.height!==media.videoHeight)){m.width=media.videoWidth;m.height=media.videoHeight;layout();}});}
      else{media.alt=m.label;media.src=m.thumb||m.src;media.loading='lazy';media.decoding='async';}
      slide.append(media);
      if(m.type==='video'){const mark=document.createElement('span');mark.className='card-video-mark';mark.textContent='▶';mark.setAttribute('aria-hidden','true');slide.append(mark);}
      const open=e=>{if(e?.type==='click'&&e.detail!==0&&(performance.now()<ignoreUntil||held?.moved)){e?.preventDefault();return;}if(e?.target?.closest('video[controls]'))return;activeIndex=i;updateCount();openFull();};
      slide.onclick=open;slide.onkeydown=e=>{if(e.target!==slide)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
      slide.style.opacity='0';stage.append(slide);slides.push({el:slide,media,item:m,visible:null,shouldPlay:null});
    });
    function updateCount(){countElement.textContent=`${String(activeIndex+1).padStart(2,'0')} / ${String(currentMedia.length).padStart(2,'0')}`;}
    function layout(){
      if(held?.dragging)offset=held.desired;
      const oldCenter=centers[activeIndex]??0,relative=offset-oldCenter;let x=0;const h=stage.clientHeight;
      // Stills and videos share the same measured source-edge crop. Reapply
      // after metadata arrives and when the gallery changes size.
      slides.forEach(({media,item:m})=>{
        if(!m.trim||!m.width||!m.height)return;
        const contentWidth=m.width-(m.trim.left||0)-(m.trim.right||0);
        media.style.position='absolute';media.style.width=`${m.width/contentWidth*100}%`;
        media.style.left=`${-(m.trim.left||0)/contentWidth*100}%`;media.style.top='0';
      });
      widths=currentMedia.map(m=>h*(m.width&&m.height?(m.width-(m.trim?.left||0)-(m.trim?.right||0))/m.height:16/9));
      widths.forEach((width,i)=>{centers[i]=x+width/2;x+=width+gap();slides[i].el.style.width=`${width}px`;});period=x;offset=centers[activeIndex]+(centers.length?relative:0);target=null;if(held?.dragging){held.origin=offset;held.x=held.lastX;held.desired=offset;held.velocity=0;}draw();
    }
    function draw(){
      const half=stage.clientWidth/2;let nearest=0,min=Infinity;
      slides.forEach((s,i)=>{
        const dx=wrap(centers[i]-offset),distance=Math.abs(dx),edge=Math.min(1.4,distance/Math.max(1,half));
        const visible=distance<half+widths[i]/2+30;
        // Only visible cards need expensive perspective/blur updates.
        if(visible){
          const scale=1-Math.min(.1,edge*.075),angle=Math.max(-18,Math.min(18,-dx/half*15));
          s.el.style.transform=`translate3d(${half+dx-widths[i]/2}px,0,${-Math.min(90,edge*65)}px) rotateY(${angle}deg) scale(${scale})`;
          s.el.style.zIndex=String(100-Math.round(Math.min(90,edge*40)));
          s.el.style.filter=`blur(${Math.pow(Math.max(0,edge-.42),2)*4}px)`;
        }
        if(visible!==s.visible){
          s.visible=visible;s.el.style.opacity=visible?1:0;s.el.tabIndex=visible?0:-1;s.el.setAttribute('aria-hidden',String(!visible));
        }
        // Fetch the next cards before they enter the viewport during a quick drag.
        const nearby=distance<half+widths[i]/2+half*.65;
        if(nearby&&s.item.type==='image'&&s.media.getAttribute('src')!==s.item.src){s.media.loading='eager';s.media.src=s.item.src;}
        if(s.item.type==='video'){
          if(nearby&&!s.media.getAttribute('src'))s.media.src=s.item.src;
          const shouldPlay=visible&&!paused&&(!dialog.open||expanded);
          if(shouldPlay!==s.shouldPlay){s.shouldPlay=shouldPlay;if(shouldPlay)s.media.play().catch(()=>{});else s.media.pause();}
        }
        if(distance<min){min=distance;nearest=i;}
      });
      if(activeIndex!==nearest){activeIndex=nearest;updateCount();}
    }
    function animate(now){
      const elapsed=lastFrame?Math.min(40,now-lastFrame):16.667,dt=elapsed/16.667;lastFrame=now;let moving=false;
      if(held?.dragging){offset=held.desired;moving=true;}
      else{
        if(target!==null){const delta=target-offset;if(Math.abs(delta)<.25){offset=target;target=null;}else{offset+=delta*(1-Math.pow(.8,dt));moving=true;}}
        if(Math.abs(momentum)>.012&&!reduceMotion.matches&&!document.hidden){
          const decay=Math.exp(-elapsed/150);offset+=momentum*150*(1-decay);momentum*=decay;moving=true;
        }else momentum=0;
      }
      const running=!expanded&&!held&&!paused&&!reduceMotion.matches&&!document.hidden;
      if(running){const shift=.22*dt;offset-=shift;if(target!==null)target-=shift;}
      draw();frame=(moving||running)&&!disposed?requestAnimationFrame(animate):0;if(!frame)lastFrame=0;
    }
    const start=()=>{if(!frame&&!disposed)frame=requestAnimationFrame(animate);};
    function go(index){momentum=0;index=(index+slides.length)%slides.length;target=offset+wrap(centers[index]-offset);if(reduceMotion.matches){offset=target;target=null;draw();}else start();activeIndex=index;updateCount();announce(currentMedia[index].label);}
    function beginDrag(){
      if(!held||held.dragging||disposed)return;
      held.dragging=true;held.origin=offset;held.desired=offset;target=null;momentum=0;
      // Capture the stable stage, not a card that can wrap to the other side.
      stage.setPointerCapture(held.id);stage.classList.add('is-dragging');start();
    }
    const down=e=>{
      if(e.button!==0||!e.isPrimary||held)return;
      const controlledVideo=e.target.closest('video[controls]');if(controlledVideo&&e.clientY>controlledVideo.getBoundingClientRect().bottom-46)return;
      const bounds=stage.getBoundingClientRect();momentum=0;target=null;ignoreUntil=0;
      held={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,time:performance.now(),scale:bounds.width/stage.clientWidth,threshold:e.pointerType==='touch'?12:8,moved:false,dragging:false,velocity:0};
      // A stationary press remains a click; capture only after intentional movement.
    };
    const move=e=>{
      if(!held||held.id!==e.pointerId)return;
      const now=performance.now(),distance=Math.hypot(e.clientX-held.x,e.clientY-held.y);
      if(distance>held.threshold){held.moved=true;if(Math.abs(e.clientX-held.x)>=Math.abs(e.clientY-held.y))beginDrag();}
      if(held.dragging){
        const elapsed=Math.max(4,now-held.time),speed=-(e.clientX-held.lastX)/held.scale/elapsed;
        held.velocity=held.velocity*.55+Math.max(-1.5,Math.min(1.5,speed))*.45;
        held.desired=held.origin-(e.clientX-held.x)/held.scale;
        if(e.cancelable)e.preventDefault();start();
      }
      held.lastX=e.clientX;held.lastY=e.clientY;held.time=now;
    };
    const up=e=>{
      if(!held||held.id!==e.pointerId)return;
      const released=held;held=null;
      if(released.dragging){
        offset=released.desired;
        momentum=e.type==='pointerup'&&released.moved&&performance.now()-released.time<80&&!reduceMotion.matches?released.velocity:0;
      }
      if(released.moved||released.dragging||e.type==='pointercancel')ignoreUntil=performance.now()+400;
      stage.classList.remove('is-dragging');
      if(stage.hasPointerCapture?.(released.id))stage.releasePointerCapture(released.id);
      draw();start();
    };
    const cancelDrag=()=>{momentum=0;if(held)up({pointerId:held.id,type:'pointercancel'});};
    function expand(){
      if(expanded||disposed)return;
      held=null;momentum=0;stage.classList.remove('is-dragging');
      const index=activeIndex;
      returnState={index,relative:(offset-centers[index])/stage.clientHeight,nodes:[stage,controls,playButton].map(node=>{const slot=document.createComment('gallery return position');node.replaceWith(slot);return {node,slot};})};
      expanded=true;dialog.classList.remove('full-media');dialog.classList.add('gallery-modal');
      dialog.setAttribute('aria-label',`${activeProject.en} — enlarged gallery`);
      dialogContent.replaceChildren(stage,controls,playButton);
      slides.forEach(s=>{if(s.item.type==='video')s.media.controls=true;s.shouldPlay=null;});
      dialog.showModal();layout();offset=centers[index];target=null;activeIndex=index;draw();updateCount();start();
    }
    function restore(){
      if(!expanded)return;
      held=null;momentum=0;stage.classList.remove('is-dragging');
      const saved=returnState;expanded=false;returnState=null;
      saved.nodes.forEach(({node,slot})=>slot.replaceWith(node));
      slides.forEach(s=>{if(s.item.type==='video')s.media.controls=false;s.shouldPlay=null;});
      dialog.classList.remove('gallery-modal');dialog.setAttribute('aria-label','Project media');
      activeIndex=saved.index;layout();offset=centers[saved.index]+saved.relative*stage.clientHeight;target=null;draw();updateCount();start();
    }
    const resume=()=>{if(!disposed){draw();start();}};
    const visibility=()=>{if(document.hidden){cancelDrag();cancelAnimationFrame(frame);frame=0;lastFrame=0;}else{slides.forEach(s=>{if(s.item.type==='video')s.shouldPlay=null;});resume();}};
    stage.addEventListener('pointerdown',down);window.addEventListener('pointermove',move,{passive:false});window.addEventListener('blur',cancelDrag);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);stage.addEventListener('lostpointercapture',up);stage.addEventListener('dragstart',e=>e.preventDefault());
    window.addEventListener('resize',layout);dialog.addEventListener('close',resume);document.addEventListener('visibilitychange',visibility);
    playButton.onclick=()=>{paused=!paused;playButton.textContent=paused?'▶':'Ⅱ';playButton.setAttribute('aria-label',paused?'Play gallery motion and videos':'Pause gallery motion and videos');draw();start();};
    playButton.setAttribute('aria-label',paused?'Play gallery motion and videos':'Pause gallery motion and videos');
    if(paused)playButton.textContent='▶';
    layout();updateCount();start();
    return {go,expand,restore,destroy(){restore();disposed=true;held=null;cancelAnimationFrame(frame);window.removeEventListener('resize',layout);window.removeEventListener('pointermove',move);window.removeEventListener('blur',cancelDrag);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);dialog.removeEventListener('close',resume);document.removeEventListener('visibilitychange',visibility);slides.forEach(s=>{if(s.item.type==='video')s.media.pause();});}};
  }
  function selectMedia(index){if(gallery)gallery.go(index);}
  function openFull(){
    if(!gallery)return;
    if(dialog.open){gallery.go(activeIndex);return;}
    gallery.expand();
  }
  dialog.querySelector('.dialog-close').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog||(dialog.classList.contains('gallery-modal')&&e.target===dialogContent))dialog.close();});
  dialog.addEventListener('close',()=>{gallery?.restore();pauseMedia(dialog);});
  dialog.addEventListener('keydown',e=>{if(!dialog.classList.contains('gallery-modal'))return;if(e.target.closest('video[controls]'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();gallery?.go(activeIndex+(e.key==='ArrowRight'?1:-1));}});
  function renderAbout(){
    const experience=[
      ['北京星驰传媒有限公司','视觉设计师','2025.11—2026.03'],
      ['北京爱博品牌创意有限公司','视觉设计师','2024.03—2025.06'],
      ['北京稻韫资本有限公司','品牌插画设计师','2022.04—2023.12'],
      ['北京作业帮教育科技有限公司','平面设计师','2021.02—2022.03'],
      ['北京利雅法盛投资咨询有限公司','平面设计师','2017.07—2020.11']
    ];
    root.innerHTML=`<section class="about-scene about-centered route-enter" aria-label="About Cecile"><div class="about-profile" tabindex="0" aria-label="个人介绍与履历"><h1>CECILE</h1><div class="profile-intro"><p>我是王茜 Cecile，现居北京，<br class="profile-break">毕业于西安美术学院 · 视觉传达设计专业。</p><p>工作时间：2017—2025<br>期望岗位：品牌、平面、插画设计</p></div><div class="profile-contact" aria-label="联系方式"><a href="mailto:ceciletttop@foxmail.com">ceciletttop@foxmail.com</a><a href="tel:+8617611646909">17611646909</a><span>微信：ceciletttop</span></div><div class="profile-details"><div class="profile-tabs"><button type="button" aria-expanded="false" aria-controls="profile-experience">工作经历 <span aria-hidden="true">＋</span></button><button type="button" aria-expanded="false" aria-controls="profile-skills">个人能力 <span aria-hidden="true">＋</span></button></div><div class="profile-panels"><div id="profile-experience" hidden><ol class="profile-experience">${experience.map(([company,role,date])=>`<li><strong>${esc(company)}</strong><span>${esc(role)}</span><time>${esc(date)}</time></li>`).join('')}</ol></div><div id="profile-skills" class="profile-skills" hidden><p><strong>技能</strong>精通 PS / AI / ID 等平面设计软件，Figma 及 Midjourney、即梦、Nano-Banana、ChatGPT 等 AI 软件。</p><p><strong>擅长</strong>品牌视觉创意及应用体系搭建、图形插画及风格延展、IP 形象的设计及相关视觉衍生、AI 生图及视觉合成。</p></div></div></div></div><div class="about-polaroids" aria-label="四张人物视觉作品"><figure class="about-polaroid about-polaroid-1"><img src="../assets/about-polaroid-1.webp" alt="花园中的粉色创意工作室" width="1000" height="1340"><figcaption aria-hidden="true"></figcaption></figure><figure class="about-polaroid about-polaroid-2"><img src="../assets/about-polaroid-2.webp" alt="百合花与香水人物肖像" width="1000" height="1340"><figcaption aria-hidden="true"></figcaption></figure><figure class="about-polaroid about-polaroid-3"><img src="../assets/about-polaroid-3.webp" alt="紫色花饰与旗袍人物肖像" width="1000" height="1340"><figcaption aria-hidden="true"></figcaption></figure><figure class="about-polaroid about-polaroid-4"><img src="../assets/about-polaroid-4.webp" alt="柏树花园中的人物" width="1000" height="1340"><figcaption aria-hidden="true"></figcaption></figure></div></section>`;
    const buttons=[...root.querySelectorAll('.profile-tabs button')];
    const tabs=root.querySelector('.profile-tabs'),panels=root.querySelector('.profile-panels');
    const fitPanels=()=>{
      const first=buttons[0].getBoundingClientRect(),last=buttons[1].getBoundingClientRect(),row=tabs.getBoundingClientRect();
      panels.style.marginLeft=`${first.left-row.left}px`;
      panels.style.width=`${last.right-first.left}px`;
    };
    const profileSize=new ResizeObserver(fitPanels);
    [tabs,...buttons].forEach(element=>profileSize.observe(element));
    fitPanels();
    cleanup=()=>profileSize.disconnect();
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const open=button.getAttribute('aria-expanded')!=='true';
      buttons.forEach(item=>{
        const selected=item===button&&open;
        item.setAttribute('aria-expanded',String(selected));
        root.querySelector('#'+item.getAttribute('aria-controls')).hidden=!selected;
      });
      root.querySelector('.profile-panels').scrollTop=0;
    }));
  }
  function renderRoute(){
    setWorkMenu(false);applySceneCategory=null;
    cleanup();cleanup=()=>{};pauseMedia();if(dialog.open)dialog.close();activeProject=null;currentMedia=[];
    const hash=decodeURIComponent(location.hash.slice(1)||'home'),p=hash.startsWith('project/')?projects.find(p=>p.id===hash.slice(8)):null;
    const mode=p?'project':hash==='about'?'about':hash==='work'?'work':'home';
    document.body.classList.toggle('project-view',!!p);document.body.classList.toggle('about-view',mode==='about');closeProject.hidden=!(p||mode==='about');closeProject.setAttribute('aria-label',mode==='about'?'Close about and return to work':'Close project and return to work');
    document.body.classList.toggle('scene-view',mode==='home'||mode==='work');
    document.querySelectorAll('nav a').forEach(a=>{if(a.hash===`#${mode}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.title=p?`${p.en} — Designer Cecile`:`${mode==='about'?'About — ':''}Designer Cecile — Creative Portfolio`;
    if(p)renderProject(p);else if(mode==='about')renderAbout();else renderScene(mode);
    announce(p?p.title:mode==='about'?'About Designer Cecile':'Creative Portfolio, seven projects');
  }
  workTrigger.addEventListener('click',()=>setWorkMenu(!workMenuOpen));
  workTrigger.addEventListener('keydown',event=>{
    if(event.key==='ArrowDown'){event.preventDefault();event.stopPropagation();setWorkMenu(true);}
  });
  workMenu.querySelectorAll('.category-button').forEach(button=>button.addEventListener('click',()=>{
    homeFilter=button.dataset.category==='all'||homeFilter===button.dataset.category?null:button.dataset.category;setWorkMenu(false);
    if(location.hash==='#work')applySceneCategory?.();else location.hash='work';workTrigger.focus();
  }));
  workMenu.addEventListener('click',event=>{if(event.target===workMenu)setWorkMenu(false);});
  document.addEventListener('keydown',event=>{
    if(!workMenuOpen)return;
    const items=[workTrigger,...workMenu.querySelectorAll('.category-button')];
    if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();setWorkMenu(false);workTrigger.focus();}
    else if(event.key==='Tab'){event.preventDefault();const index=items.indexOf(document.activeElement);items[(index+(event.shiftKey?-1:1)+items.length)%items.length].focus();}
    else if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();const rows=items.slice(1),index=rows.indexOf(document.activeElement);rows[(index+(event.key==='ArrowDown'?1:-1)+rows.length)%rows.length].focus();}
  });
  closeProject.onclick=()=>{location.hash=previousScene;};
  window.addEventListener('hashchange',renderRoute);
  window.addEventListener('keydown',e=>{
    if(dialog.open)return;
    if(activeProject){if(e.key==='ArrowRight'){e.preventDefault();selectMedia(activeIndex+1);}if(e.key==='ArrowLeft'){e.preventDefault();selectMedia(activeIndex-1);}if(e.key==='Escape')location.hash=previousScene;}
  });
  renderRoute();
})();
