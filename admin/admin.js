'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='cecile-admin-draft-v1';
const initial=window.SITE_CONTENT||{version:1,projects:window.PORTFOLIO_PROJECTS.map(p=>({...p,categoryIds:[...(p.tags.includes('character')?['ip']:[]),...(p.videos.length?['video']:[]),...(['planet','vesper','identity'].includes(p.id)?['poster']:[])]})),categories:[{id:'ip',name:'IP Design'},{id:'video',name:'Video Design'},{id:'poster',name:'Poster Design'}],selected:window.PORTFOLIO_PROJECTS.map(p=>p.id),hello:{greeting:'Hello,',name:'I’m Cecile',educationTitle:'Graduate School',school:'西安美术学院',major:'视觉传达设计',expertiseTitle:'Personal Expertise',expertise:'品牌视觉创意及应用体系搭建、图形插画与风格延展、IP 形象设计及视觉衍生、AIGC 生图与视觉合成',contactTitle:'Contact Information',email:'ceciletttop@gmail.com',wechat:'Ceciletttop'}};
let data=structuredClone(initial),page='portfolio',filter='all',query='',dirty=false,undo=null,toastTimer;
try{const saved=JSON.parse(localStorage.getItem(KEY));if(saved?.version===1&&Array.isArray(saved.projects)&&Array.isArray(saved.categories)&&Array.isArray(saved.selected)&&saved.hello)data=saved;}catch{}
const img=p=>p.coverThumb||p.cover;
const orbitImg=p=>p.orbitCover||img(p);
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),2800);}
function changed(){revision++;dirty=true;$('#save-state').textContent='● 有未保存的更改';$('#save-state').style.color='#aa8757';}
let draftDB, revision=0, initializing=true;
function validDraft(value){return value?.version===1&&Array.isArray(value.projects)&&Array.isArray(value.categories)&&Array.isArray(value.selected)&&value.hello;}
function openDraftDB(){return new Promise((resolve,reject)=>{const request=indexedDB.open('cecile-admin',1);request.onupgradeneeded=()=>request.result.createObjectStore('drafts');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);request.onblocked=()=>reject(new Error('数据库被占用'));});}
function accessDraft(mode,value){return new Promise((resolve,reject)=>{const tx=draftDB.transaction('drafts',mode),store=tx.objectStore('drafts'),request=mode==='readonly'?store.get(KEY):store.put(value,KEY);tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('保存中断'));});}
async function boot(){
 $('#save').disabled=true;$('#export').disabled=true;
 try{draftDB=await openDraftDB();const saved=await accessDraft('readonly');if(validDraft(saved))data=saved;}
 catch{toast('本机数据库不可用；可以编辑和导出，保存暂不可用');}
 finally{if(!data.revision&&initial.revision)data.revision=initial.revision;initializing=false;$('#save').disabled=false;$('#export').disabled=false;render();}
}
async function save(){
 if(initializing)return;const button=$('#save');button.disabled=true;const savedRevision=revision;
 try{if(!draftDB)draftDB=await openDraftDB();await accessDraft('readwrite',structuredClone(data));if(revision===savedRevision){dirty=false;$('#save-state').textContent='● 已保存到本机';$('#save-state').style.color='#719078';}toast(revision===savedRevision?'原始媒体与内容已保存到当前浏览器':'已保存快照，最新更改请再次保存');}
 catch{toast('保存失败或本机空间不足，请导出配置备份');}
 finally{button.disabled=false;}
}
function openModal(html){$('#modal-content').innerHTML=html;$('#modal').showModal();$('#modal').querySelector('[data-close]')?.addEventListener('click',()=>$('#modal').close());}
function confirmAction(title,description,action){openModal(`<h2>${esc(title)}</h2><p>${esc(description)}</p><div class="modal-actions"><button data-close>取消</button><button class="primary" id="confirm-action">确认删除</button></div>`);$('#confirm-action').onclick=()=>{undo=structuredClone(data);action();changed();$('#modal').close();render();toast('已删除，可使用页面底部的撤销恢复');};}
function selectedProjects(){return data.selected.map(id=>data.projects.find(p=>p.id===id)).filter(Boolean);}

let portfolioResizeObserver;
function portfolioText(){return {title:data.portfolio?.title??'Portfolio',subtitle:data.portfolio?.subtitle??'Creativity',year:data.portfolio?.year??'2026'};}
function sendPortfolioText(){const frame=$('#portfolio-preview');frame?.contentWindow.postMessage({type:'portfolio-text',text:portfolioText()},location.origin);}
window.addEventListener('message',event=>{
 const frame=$('#portfolio-preview');
 if(event.origin!==location.origin||event.source!==frame?.contentWindow||event.data?.type!=='portfolio-text-edit')return;
 const {key,value}=event.data;if(!['title','subtitle','year'].includes(key)||typeof value!=='string')return;
 data.portfolio={...portfolioText(),[key]:value.slice(0,200)};changed();
 const input=document.querySelector('[data-portfolio-text="'+key+'"]');if(input)input.value=data.portfolio[key];
});
function mountPortfolioPreview(){
 portfolioResizeObserver?.disconnect();
 const frame=$('#portfolio-preview'), holder=$('.portfolio-frame'), canvas=$('.portfolio-canvas');
 const fit=()=>{const scale=Math.min((canvas.clientWidth-32)/1440,(canvas.clientHeight-32)/1000);const zoom=Math.max(.1,scale);holder.style.width=1440*zoom+'px';holder.style.height=1000*zoom+'px';frame.style.transform='scale('+zoom+')';};
 portfolioResizeObserver=new ResizeObserver(fit);portfolioResizeObserver.observe(canvas);fit();
 frame.addEventListener('load',()=>frame.contentWindow.postMessage({type:'portfolio-preview',text:portfolioText(),projects:selectedProjects().map(p=>({id:p.id,title:p.title,en:p.en,src:new URL(orbitImg(p),location.href).href}))},location.origin));
}

function orbitMarkup(){const list=selectedProjects();return `<div class="orbit-preview"><div class="orbit-title"><strong>Portfolio</strong><em>Creativity</em><small>CECILE · SELECTED VISIONS</small></div><div class="ring">${list.map((p,i)=>{let a=(-95+i*360/list.length)*Math.PI/180;return `<img alt="${esc(p.title)}" src="${esc(orbitImg(p))}" style="--x:${Math.cos(a)*185}px;--y:${Math.sin(a)*101}px;--r:${Math.cos(a)*12}deg">`;}).join('')}</div></div>`;}
function card(p,selection){const checked=data.selected.includes(p.id);return `<article class="image-card ${selection&&checked?'selected':''}"><button class="cover-button" data-${selection?'select':'edit'}="${esc(p.id)}" ${selection?`aria-pressed="${checked}"`:''} aria-label="${selection?'选择图片组：':'编辑项目：'}${esc(p.en)}"><img src="${esc(selection?orbitImg(p):img(p))}" alt="${esc(p.title)}" loading="lazy">${selection?'<span class="check">✓</span>':''}</button><div class="card-info"><strong>${esc(p.en)}</strong><small>${esc(p.title)} · ${p.images.length} 张图片${p.videos?.length?` · ${p.videos.length} 个视频`:""}</small><div class="card-actions">${selection?`<button data-image="${esc(p.id)}">更换展示图</button><button data-move="${esc(p.id)}" aria-label="将 ${esc(p.en)} 前移" ${!checked||data.selected.indexOf(p.id)===0?'disabled':''}>← 前移</button>`:`<button data-edit="${esc(p.id)}">编辑项目</button><button class="danger" data-delete="${esc(p.id)}">删除</button>`}</div></div></article>`;}
function statusBar(){return `<div class="selection-bar"><span>${page==='portfolio'?`✓ 已选择 ${data.selected.length} 个图片组 · 点击封面选择或取消`:`共 ${data.projects.length} 个项目 · ${data.categories.length} 个分类`}</span>${undo?'<button id="undo">↶ 撤销上次删除</button>':'<span>更改后记得保存 ↗</span>'}</div>`;}
function renderCards(){const ordered=page==='portfolio'?[...selectedProjects(),...data.projects.filter(p=>!data.selected.includes(p.id))]:data.projects;const list=ordered.filter(p=>(page==='portfolio'||filter==='all'||p.categoryIds.includes(filter))&&`${p.en} ${p.title}`.toLowerCase().includes(query.toLowerCase()));$('#cards').innerHTML=list.length?list.map(p=>card(p,page==='portfolio')).join(''):'<div class="empty">暂无匹配的项目。尝试其他分类或添加新项目。</div>';}
function render(){const portfolioScroll=$('.portfolio-tools')?.scrollTop||0;document.body.classList.toggle('portfolio-workspace',page==='portfolio');document.body.classList.toggle('hello-workspace',page==='hello');helloEditorCleanup();portfolioResizeObserver?.disconnect();const labels={portfolio:['01','Portfolio','首页作品精选','挑选出现在首页旋转画廊中的图片，让第一眼就留下印象。'],work:['02','Selected work','项目与分类','整理你的创作，管理项目与分类，让每件作品找到自己的位置。'],hello:['03','Hello','关于我','更新你的自我介绍，让大家认识作品背后的你。']}[page];$('#breadcrumb').textContent=labels[1];$('#section-number').textContent='CONTENT MANAGEMENT / '+labels[0];$('#page-title').innerHTML=`${labels[1]}<span>${labels[2]}</span>`;$('#page-description').textContent=labels[3];document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===page);b.setAttribute('aria-current',b.dataset.page===page?'page':'false');});
if(page==='portfolio'){$('#content').innerHTML=`<section class="panel portfolio-editor"><div class="panel-head"><h2>首页预览</h2><span class="chip">实时预览 · 原网页样式</span></div><div class="portfolio-workbench"><div class="portfolio-canvas"><div class="portfolio-frame"><iframe id="portfolio-preview" title="首页原网页预览" src="portfolio-preview.html?v=portfolio-text-1"></iframe></div></div><aside class="portfolio-tools" aria-label="首页工具栏"><section class="portfolio-text-tools"><h2>首页文字</h2><p class="muted">可在左侧双击文字直接编辑</p>${Object.entries({title:"主标题",subtitle:"副标题",year:"年份"}).map(([key,label])=>`<label>${label}<input data-portfolio-text="${key}" aria-label="首页${label}" maxlength="200" value="${esc(portfolioText()[key])}"></label>`).join("")}</section><div class="portfolio-tools-heading"><h2>图片组</h2><span>已选择 ${data.selected.length} / ${data.projects.length}</span></div><p class="muted">点击封面选择或取消；按选中顺序展示。</p><input class="search" id="search" aria-label="搜索图片组" placeholder="⌕  搜索图片组" value="${esc(query)}"><div class="cards" id="cards"></div></aside></div><div class="portfolio-hint">调整右侧图片组，左侧同步预览。保存草稿后，点击「发布到网站」更新公开网站。</div></section>`;renderCards();mountPortfolioPreview();document.querySelectorAll('[data-portfolio-text]').forEach(input=>input.addEventListener('input',()=>{data.portfolio={...portfolioText(),[input.dataset.portfolioText]:input.value};changed();sendPortfolioText();}));$('.portfolio-tools').scrollTop=portfolioScroll;}
else if(page==='work'){$('#content').innerHTML=`<section class="panel"><div class="panel-head"><div><h2>分类按钮</h2><p>分类名称将用于作品页的筛选按钮，All work 为固定入口。</p></div><button id="add-category">＋ 新增分类</button></div><div class="category-bar"><button data-filter="all" class="${filter==='all'?'active':''}">All work</button>${data.categories.map(c=>`<div class="category-item"><button data-filter="${esc(c.id)}" class="${filter===c.id?'active':''}">${esc(c.name)} <span> ${data.projects.filter(p=>p.categoryIds.includes(c.id)).length}</span></button><button aria-label="删除分类 ${esc(c.name)}" data-delete-category="${esc(c.id)}">×</button></div>`).join('')}</div></section><div class="sub-head"><h2>项目列表 <span>${data.projects.length} PROJECTS</span></h2><div style="display:flex;gap:10px"><input class="search" id="search" aria-label="搜索项目" placeholder="⌕  搜索项目" value="${esc(query)}"><button class="primary" id="add-project">＋ 新增项目</button></div></div><div class="cards" id="cards"></div>${statusBar()}`;renderCards();}
else renderHello();$('#search')?.addEventListener('input',e=>{query=e.target.value;renderCards();});}
function helloBlocks(){return HelloCanvas.blocks(data.hello);}
function helloPreview(){return ''; }
function renderHello(){helloBlocks();$('#content').innerHTML='<div class="hello-inline-layout"><section class="panel hello-preview-panel"><div id="hello-preview" class="hello-preview"></div></section></div>';mountHelloCanvas();}
function editProject(id){
 const p=data.projects.find(p=>p.id===id);
 let images=structuredClone(p?.images||[]), videos=structuredClone(p?.videos||[]), busy=false, alive=true, compressionController=null;
 openModal(`<h2>${p?'编辑项目':'新增项目'}</h2><p>设置项目信息并添加图片，第一张图片自动作为封面。</p><form id="project-form"><div class="project-fields"><label class="field">英文项目名<input name="en" required maxlength="80" value="${esc(p?.en||'')}" placeholder="PROJECT NAME"></label><label class="field">中文项目名<input name="title" required maxlength="80" value="${esc(p?.title||'')}" placeholder="为作品起一个名字"></label><label class="field">项目介绍<textarea name="summary" maxlength="2000">${esc(p?.summary||'')}</textarea></label><label class="field">项目分类<select name="category"><option value="">未分类</option>${data.categories.map(c=>`<option value="${esc(c.id)}" ${p?.categoryIds[0]===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><div class="upload-heading"><span>项目图片与视频</span><span id="upload-count" aria-live="polite"></span></div><div class="upload-zone" id="upload-zone"><span class="upload-icon" aria-hidden="true">↑</span><strong>将图片或视频拖到这里，或点击选择</strong><span>支持一次多选，也可以分批添加</span><label class="upload-button">选择文件<input id="project-files" type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" aria-label="选择项目图片或视频（可多选）"></label><small>图片 JPG、PNG、WebP ≤ 10MB；视频 MP4、WebM、MOV ≤ 100MB（100,000,000 字节）。100MB 以内保留原文件；超限视频确认后压缩到约 95MB。</small></div><p class="upload-hint">按住图片拖动到目标位置，松开即可插入到目标图片前面，其余图片顺移，第一张自动作为封面；右上角可删除图片。保存草稿后，点击「发布到网站」更新公开网站。</p><div id="upload-grid" class="upload-grid"></div><span id="sort-status" class="sr-only" role="status" aria-live="polite"></span><div id="video-list"></div><div id="compression-panel" aria-live="polite"></div><p id="form-error" role="alert"></p></div><div class="modal-actions"><button type="button" data-close>取消</button><button type="submit" class="primary" id="project-submit">${p?'保存项目':'创建项目'}</button></div></form>`);
 const form=$('#project-form'),zone=$('#upload-zone'),input=$('#project-files'),grid=$('#upload-grid'),error=$('#form-error'),submit=$('#project-submit'),modal=$('#modal');
 function renderImages(){
  $('#upload-count').textContent=`已选 ${images.length} 张图片 · ${videos.length} 个视频`;
  grid.innerHTML=images.map((im,i)=>`<div data-sort-index="${i}" class="upload-tile ${i===0?'is-cover':''}"><div class="upload-tile-toolbar"><span class="cover-label">${i===0?'封面':''}</span><button type="button" data-remove-index="${i}" aria-label="删除图片 ${i+1}：${esc(im.original||im.label||'项目图片')}" class="danger" title="删除图片">×</button></div><img class="sort-handle" draggable="false" tabindex="0" title="长按拖动插入到目标图片前面；第一张为封面；Alt + 左右方向键调整位置" src="${esc(im.src)}" alt="${esc(im.original||im.label||'项目图片')}" loading="lazy"><span class="upload-filename" title="${esc(im.original||im.label)}">${esc(im.original||im.label||`图片 ${i+1}`)}</span></div>`).join('');
 }
 grid.onclick=e=>{const b=e.target.closest('[data-remove-index]');if(!b||busy)return;images.splice(Number(b.dataset.removeIndex),1);renderImages();$('#sort-status').textContent=images.length?'已删除图片，第一张为封面':'已删除全部图片，请添加图片';};
 // Pointer-based sorting keeps touch and mouse behavior consistent.
 let sorting=null,pressTimer,scrollFrame,suppressClick=false;
 function moveImage(from,to,before=true){
  if(from<0||to<0||from>=images.length||to>=images.length)return from;
  const destination=before&&from<to?to-1:to;
  if(from===destination){$('#sort-status').textContent='顺序未改变';return from;}
  const [image]=images.splice(from,1);
  images.splice(destination,0,image);
  renderImages();
  $('#sort-status').textContent=`已将第 ${from+1} 张图片移到第 ${destination+1} 位，其余图片依次顺移`;
  return destination;
 }
 function updateTarget(){
  if(!sorting?.active)return;
  const r=grid.getBoundingClientRect(),f=form.querySelector('.project-fields').getBoundingClientRect();
  const bounds={left:Math.max(r.left,f.left),right:Math.min(r.right,f.right),top:Math.max(r.top,f.top),bottom:Math.min(r.bottom,f.bottom)};
  let target=null,best=Infinity;
  // Geometry includes the gaps between unequal-height cards and ignores the drag preview.
  if(sorting.x>=bounds.left&&sorting.x<=bounds.right&&sorting.y>=bounds.top&&sorting.y<=bounds.bottom){
   grid.querySelectorAll('[data-sort-index]').forEach(tile=>{
    const box=tile.getBoundingClientRect();if(box.bottom<=bounds.top||box.top>=bounds.bottom)return;
    const dx=Math.max(box.left-sorting.x,0,sorting.x-box.right),dy=Math.max(box.top-sorting.y,0,sorting.y-box.bottom),distance=dx*dx+dy*dy;
    if(distance<best){best=distance;target=tile;}
   });
  }
  const to=target?Number(target.dataset.sortIndex):-1;
  if(to!==sorting.to){grid.querySelector('.sort-target')?.classList.remove('sort-target');sorting.to=to;if(to>=0&&to!==sorting.from)target.classList.add('sort-target');}
  sorting.ghost.style.left=`${sorting.x-sorting.offsetX}px`;
  sorting.ghost.style.top=`${sorting.y-sorting.offsetY}px`;
 }
 function autoScroll(now){
  if(!sorting?.active)return;
  const elapsed=Math.min(32,now-(sorting.lastFrame||now));sorting.lastFrame=now;
  const fields=form.querySelector('.project-fields'),r=grid.getBoundingClientRect(),f=fields.getBoundingClientRect();
  const top=Math.max(r.top,f.top),bottom=Math.min(r.bottom,f.bottom),edge=Math.min(60,(bottom-top)/3);
  if(edge>0&&sorting.x>=r.left&&sorting.x<=r.right&&sorting.y>=top-24&&sorting.y<=bottom+24){
   const speed=sorting.y<top+edge?-Math.min(1,(top+edge-sorting.y)/edge):sorting.y>bottom-edge?Math.min(1,(sorting.y-bottom+edge)/edge):0;
   const step=speed*elapsed*.65;
   if(step){const before=grid.scrollTop;grid.scrollTop+=step;const used=grid.scrollTop-before;if((step<0&&r.top<f.top)||(step>0&&r.bottom>f.bottom))fields.scrollTop+=step-used;}
  }
  updateTarget();scrollFrame=requestAnimationFrame(autoScroll);
 }
 function activateSort(){
  if(!sorting||!alive||busy)return;
  sorting.active=true;suppressClick=true;
  const r=sorting.tile.getBoundingClientRect();
  sorting.offsetX=sorting.startX-r.left;sorting.offsetY=sorting.startY-r.top;
  sorting.ghost=sorting.tile.cloneNode(true);sorting.ghost.classList.add('sort-ghost');sorting.ghost.setAttribute('aria-hidden','true');
  sorting.ghost.removeAttribute('data-sort-index');sorting.ghost.style.width=`${r.width}px`;
  sorting.ghost.querySelectorAll('button').forEach(el=>el.remove());sorting.ghost.querySelectorAll('[tabindex]').forEach(el=>el.tabIndex=-1);
  modal.append(sorting.ghost);sorting.tile.classList.add('is-sorting');grid.classList.add('sorting');
  $('#sort-status').textContent='已拾起图片，拖到目标图片上松开，插入到它的前面';
  updateTarget();scrollFrame=requestAnimationFrame(autoScroll);
 }
 function finishSort(commit){
  clearTimeout(pressTimer);cancelAnimationFrame(scrollFrame);
  if(!sorting)return;
  const {from,to,active,pointerId,ghost}=sorting;sorting=null;
  if(grid.hasPointerCapture(pointerId))grid.releasePointerCapture(pointerId);
  ghost?.remove();grid.classList.remove('sorting');grid.querySelectorAll('.is-sorting,.sort-target').forEach(el=>el.classList.remove('is-sorting','sort-target'));
  if(commit&&active&&to>=0&&to!==from)moveImage(from,to);
  else if(active)$('#sort-status').textContent='顺序未改变';
  setTimeout(()=>{suppressClick=false;},0);
 }
 grid.addEventListener('pointerdown',e=>{
  if(busy||sorting||e.button!==0||!e.isPrimary)return;
  const image=e.target.closest('.sort-handle'),tile=image?.closest('[data-sort-index]');if(!tile)return;
  sorting={pointerId:e.pointerId,from:Number(tile.dataset.sortIndex),to:-1,tile,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,active:false};
  grid.setPointerCapture(e.pointerId);pressTimer=setTimeout(activateSort,e.pointerType==='mouse'?160:220);
 });
 grid.addEventListener('pointermove',e=>{
  if(!sorting||e.pointerId!==sorting.pointerId)return;
  sorting.x=e.clientX;sorting.y=e.clientY;
  if(!sorting.active&&Math.hypot(sorting.x-sorting.startX,sorting.y-sorting.startY)>4){
   clearTimeout(pressTimer);activateSort();
  }
  if(sorting?.active){e.preventDefault();updateTarget();}
 });
 grid.addEventListener('pointerup',e=>{if(e.pointerId===sorting?.pointerId){updateTarget();finishSort(true);}});
 grid.addEventListener('pointercancel',()=>finishSort(false));
 grid.addEventListener('lostpointercapture',()=>finishSort(false));
 grid.addEventListener('dragstart',e=>e.preventDefault());
 grid.addEventListener('contextmenu',e=>{if(e.target.closest('.sort-handle'))e.preventDefault();});
 grid.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},{capture:true});
 grid.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&sorting){e.preventDefault();e.stopPropagation();finishSort(false);return;}
  const tile=e.target.closest('[data-sort-index]');if(busy||!tile||!e.altKey||!['ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();const from=Number(tile.dataset.sortIndex),to=from+(e.key==='ArrowLeft'?-1:1);
  if(to>=0&&to<images.length){moveImage(from,to,false);grid.querySelector(`[data-sort-index="${to}"] .sort-handle`).focus();}
 });
 modal.addEventListener('close',()=>finishSort(false),{once:true});
 function renderVideos(){
  $('#upload-count').textContent=`已选 ${images.length} 张图片 · ${videos.length} 个视频`;
  $('#video-list').innerHTML=videos.length?`<h3 class="video-heading">项目视频</h3><p>详情页先展示视频，再按上方顺序展示图片。请保留至少一张图片作为项目封面。</p><div class="video-grid">${videos.map((v,i)=>`<div class="video-tile"><video controls playsinline preload="metadata" data-video-src="${esc(v.src)}" ${v.poster?`poster="${esc(v.poster)}"`:''}></video><div class="video-info"><span>${esc(v.original||v.label||`视频 ${i+1}`)}${v.size?` · ${(v.size/1000000).toFixed(1)} MB`:''}</span><button type="button" data-remove-video="${i}" aria-label="删除视频 ${i+1}" class="danger">×</button></div></div>`).join('')}</div>`:'';
  $('#video-list').querySelectorAll('video').forEach(video=>window.attachPortfolioVideo(video,video.dataset.videoSrc));
 }
 $('#video-list').onclick=e=>{const button=e.target.closest('[data-remove-video]');if(!button||busy)return;videos.splice(Number(button.dataset.removeVideo),1);renderVideos();};
 function videoDimensions(file){return new Promise((resolve,reject)=>{
  const video=document.createElement('video'),url=URL.createObjectURL(file);
  const finish=(value,error)=>{clearTimeout(timer);video.onloadedmetadata=null;video.onerror=null;video.removeAttribute('src');video.load();URL.revokeObjectURL(url);error?reject(error):resolve(value);};
  const timer=setTimeout(()=>finish(null,new Error('视频读取超时')),20000);
  video.preload='metadata';video.onloadedmetadata=()=>{const width=video.videoWidth,height=video.videoHeight;if(!width||!height)finish(null,new Error('无有效视频画面'));else finish({width,height});};
  video.onerror=()=>finish(null,new Error('浏览器无法解码此视频，请导出为 H.264 编码的 MP4 后上传'));video.src=url;
 });}
 async function confirmAndCompress(file){
  const panel=$('#compression-panel');
  const approved=await new Promise(resolve=>{
   const finish=value=>{modal.removeEventListener('close',closed);panel.replaceChildren();resolve(value);};
   const closed=()=>finish(false);modal.addEventListener('close',closed,{once:true});
   panel.innerHTML=`<strong>${esc(file.name)} · ${(file.size/1000000).toFixed(1)}MB</strong><p>超过 100MB。是否压缩到约 95MB？画质可能降低，原文件不变。处理时间约为视频时长，请保持页面在前台。输出为 MP4 或 WebM，实际大小可能更小。</p><div class="compression-actions"><button type="button" class="primary" data-compress-yes>确认压缩到约 95MB</button><button type="button" data-compress-no>跳过此视频</button></div>`;
   panel.querySelector('[data-compress-yes]').onclick=()=>finish(true);panel.querySelector('[data-compress-no]').onclick=()=>finish(false);panel.scrollIntoView({block:'nearest'});
  });
  if(!approved||!alive)return null;
  compressionController=new AbortController();
  panel.innerHTML='<p class="compression-status">正在准备压缩…请保持此页面在前台。</p><div class="compression-media"></div><button type="button" data-compress-cancel>取消压缩</button>';
  panel.querySelector('[data-compress-cancel]').onclick=()=>compressionController?.abort();
  try{return await window.compressPortfolioVideo(file,{signal:compressionController.signal,preview:panel.querySelector('.compression-media'),onProgress:percent=>{panel.querySelector('.compression-status').textContent=`正在压缩 ${percent}% · 请保持此页面在前台`;}});}
  finally{compressionController=null;panel.replaceChildren();}
 }
 async function addFiles(files){
  if(busy||!alive||sorting)return;
  const list=Array.from(files);if(!list.length)return;
  busy=true;input.disabled=true;submit.disabled=true;zone.setAttribute('aria-busy','true');error.textContent='正在读取文件…';const errors=[];
  for(let file of list){
   if(!alive)break;
   const videoType=/\.mp4$/i.test(file.name)?'video/mp4':/\.webm$/i.test(file.name)?'video/webm':/\.mov$/i.test(file.name)?'video/quicktime':null;
   const isVideo=Boolean(videoType);let type=isVideo?videoType:file.type;
   if(!isVideo&&!['image/jpeg','image/png','image/webp'].includes(type)){errors.push(`${file.name}：仅支持 JPG、PNG、WebP、MP4、WebM 或 MOV`);continue;}
   if(!file.size){errors.push(`${file.name}：文件为空`);continue;}
   if(!isVideo&&file.size>10*1024*1024){errors.push(`${file.name}：超过 10MB`);continue;}
   const key=[file.name,file.size,file.lastModified].join(':');if([...images,...videos].some(im=>im.uploadKey===key))continue;
   try{
    const originalSize=file.size,originalName=file.name;
    if(isVideo&&file.size>100000000){const compressed=await confirmAndCompress(file);if(!compressed){errors.push(`${file.name}：已跳过`);continue;}file=compressed;type=file.type;}
    if(!alive)break;
    const videoSize=isVideo?await videoDimensions(file):null;
    const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('读取失败'));r.readAsDataURL(isVideo?file.slice(0,file.size,type):file);});
    const dimensions=videoSize||await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve({width:im.naturalWidth,height:im.naturalHeight});im.onerror=()=>reject(new Error('图片损坏'));im.src=src;});
    if(!alive)break;
    if(isVideo){videos.push({src,type:'video',label:file.name,original:file.name,size:file.size,...(originalSize!==file.size?{compressed:true,originalSize,originalName}:{}),uploadKey:key,...dimensions});renderVideos();}
    else{images.push({src,thumb:src,type:'image',label:file.name,original:file.name,uploadKey:key,...dimensions});renderImages();}
   }catch(failure){errors.push(`${file.name}：${failure.message||'无法读取文件'}`);}
  }
  if(!alive)return;
  busy=false;input.disabled=false;submit.disabled=false;zone.removeAttribute('aria-busy');input.value='';error.textContent=errors.join('；');renderImages();
 }
 input.onchange=()=>addFiles(input.files);
 let dragDepth=0;
 const dragEnter=e=>{e.preventDefault();dragDepth++;zone.classList.add('is-dragging');};
 const dragOver=e=>{e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect=busy?'none':'copy';};
 const dragLeave=e=>{e.preventDefault();if(--dragDepth<=0){dragDepth=0;zone.classList.remove('is-dragging');}};
 const drop=e=>{e.preventDefault();dragDepth=0;zone.classList.remove('is-dragging');if(busy){error.textContent='正在读取上一批文件，请稍候再拖入。';return;}addFiles(e.dataTransfer?.files||[]);};
 modal.addEventListener('dragenter',dragEnter);modal.addEventListener('dragover',dragOver);modal.addEventListener('dragleave',dragLeave);modal.addEventListener('drop',drop);
 modal.addEventListener('close',()=>{alive=false;compressionController?.abort();modal.removeEventListener('dragenter',dragEnter);modal.removeEventListener('dragover',dragOver);modal.removeEventListener('dragleave',dragLeave);modal.removeEventListener('drop',drop);},{once:true});
 form.onsubmit=e=>{
  e.preventDefault();if(busy)return;
  const fd=new FormData(form),en=fd.get('en').trim(),title=fd.get('title').trim();
  if(!en||!title){error.textContent='项目名称不能只包含空格。';return;}
  if(!images.length){error.textContent='请至少选择一张项目图片作为封面（视频单独展示）。';return;}
  const category=fd.get('category'),cover=images[0];
  const updated={...(p||{id:'project-'+crypto.randomUUID(),videos:[],tags:[]}),en,title,summary:fd.get('summary').trim(),images,videos,cover:cover.src,coverThumb:cover.thumb||cover.src,categoryIds:category?[category]:[]};
  if(p&&category===(p.categoryIds[0]||''))updated.categoryIds=p.categoryIds;
  if(updated.orbitCover&&!images.some(im=>(im.thumb||im.src)===updated.orbitCover))delete updated.orbitCover;
  if(p)data.projects[data.projects.indexOf(p)]=updated;else data.projects.push(updated);
  changed();modal.close();render();toast(p?'项目已更新':`已添加项目，共 ${images.length} 张图片`);
 };
 renderImages();renderVideos();
}
function imagePicker(id){const p=data.projects.find(p=>p.id===id);openModal(`<h2>选择展示图片</h2><p>${esc(p.en)} · 选择用于首页旋转画廊的图片</p><div class="image-picker">${p.images.map((im,i)=>`<button data-pick="${i}" class="${orbitImg(p)===(im.thumb||im.src)?'active':''}" aria-label="选择第 ${i+1} 张图片"><img src="${esc(im.thumb||im.src)}" alt="${esc(im.label||p.title)}"></button>`).join('')}</div><div class="modal-actions"><button data-close>取消</button></div>`);$('#modal').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{const image=p.images[Number(b.dataset.pick)];p.orbitCover=image.thumb||image.src;changed();$('#modal').close();render();});}
document.addEventListener('click',e=>{if(initializing)return;const b=e.target.closest('button');if(!b)return;
if(b.dataset.page){page=b.dataset.page;query='';filter='all';render();}
if(b.dataset.select){const id=b.dataset.select;if(data.selected.includes(id))data.selected=data.selected.filter(x=>x!==id);else data.selected.push(id);changed();render();}
if(b.dataset.move){const index=data.selected.indexOf(b.dataset.move);if(index>0){[data.selected[index-1],data.selected[index]]=[data.selected[index],data.selected[index-1]];changed();render();}}
if(b.dataset.image)imagePicker(b.dataset.image);
if(b.dataset.edit)editProject(b.dataset.edit);
if(b.dataset.delete){const p=data.projects.find(p=>p.id===b.dataset.delete);confirmAction('删除这个项目？',`“${p.en}”将从项目列表及旋转画廊中移除。你可以撤销本次删除。`,()=>{data.projects=data.projects.filter(x=>x.id!==p.id);data.selected=data.selected.filter(x=>x!==p.id);});}
if(b.dataset.filter){filter=b.dataset.filter;render();}
if(b.dataset.deleteCategory){const c=data.categories.find(c=>c.id===b.dataset.deleteCategory);confirmAction('删除分类按钮？',`删除“${c.name}”不会删除其中的项目。项目仍会显示在 All work 中。`,()=>{data.categories=data.categories.filter(x=>x.id!==c.id);data.projects.forEach(p=>p.categoryIds=p.categoryIds.filter(x=>x!==c.id));filter='all';});}
if(b.id==='add-project')editProject();
if(b.id==='undo'&&undo){data=undo;undo=null;changed();render();toast('删除操作已撤销');}
if(b.id==='add-category'){openModal('<h2>新增分类</h2><p>创建一个新的作品筛选按钮。</p><form id="category-form"><label class="field">分类名称<input name="name" required maxlength="30" placeholder="例如：Brand Design"></label><p id="category-error" role="alert"></p><div class="modal-actions"><button type="button" data-close>取消</button><button class="primary">添加分类</button></div></form>');$('#modal [data-close]').onclick=()=>$('#modal').close();$('#category-form').onsubmit=e=>{e.preventDefault();const name=new FormData(e.currentTarget).get('name').trim();if(!name||name.toLowerCase()==='all work'||data.categories.some(c=>c.name.toLowerCase()===name.toLowerCase())){$('#category-error').textContent='请输入不重复的分类名称。';return;}data.categories.push({id:'category-'+crypto.randomUUID(),name});changed();$('#modal').close();render();toast('分类已添加');};}
});
$('#save').onclick=save;$('#export').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='cecile-content.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('已导出配置，可交给开发者用于接入网站');};
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});boot();
