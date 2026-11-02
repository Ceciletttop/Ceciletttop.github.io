'use strict';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='cecile-admin-draft-v1';
const initial={version:1,projects:window.PORTFOLIO_PROJECTS.map(p=>({...p,categoryIds:[...(p.tags.includes('character')?['ip']:[]),...(p.videos.length?['video']:[]),...(['planet','vesper','identity'].includes(p.id)?['poster']:[])]})),categories:[{id:'ip',name:'IP Design'},{id:'video',name:'Video Design'},{id:'poster',name:'Poster Design'}],selected:window.PORTFOLIO_PROJECTS.map(p=>p.id),hello:{greeting:'Hello,',name:'I’m Cecile',educationTitle:'Graduate School',school:'西安美术学院',major:'视觉传达设计',expertiseTitle:'Personal Expertise',expertise:'品牌视觉创意及应用体系搭建、图形插画与风格延展、IP 形象设计及视觉衍生、AIGC 生图与视觉合成',contactTitle:'Contact Information',email:'ceciletttop@gmail.com',wechat:'Ceciletttop'}};
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
 finally{initializing=false;$('#save').disabled=false;$('#export').disabled=false;render();}
}
async function save(){
 if(initializing)return;const button=$('#save');button.disabled=true;const savedRevision=revision;
 try{if(!draftDB)draftDB=await openDraftDB();await accessDraft('readwrite',structuredClone(data));if(revision===savedRevision){dirty=false;$('#save-state').textContent='● 已保存到本机';$('#save-state').style.color='#719078';}toast(revision===savedRevision?'原图与内容已保存到当前浏览器':'已保存快照，最新更改请再次保存');}
 catch{toast('保存失败或本机空间不足，请导出配置备份');}
 finally{button.disabled=false;}
}
function openModal(html){$('#modal-content').innerHTML=html;$('#modal').showModal();$('#modal').querySelector('[data-close]')?.addEventListener('click',()=>$('#modal').close());}
function confirmAction(title,description,action){openModal(`<h2>${esc(title)}</h2><p>${esc(description)}</p><div class="modal-actions"><button data-close>取消</button><button class="primary" id="confirm-action">确认删除</button></div>`);$('#confirm-action').onclick=()=>{undo=structuredClone(data);action();changed();$('#modal').close();render();toast('已删除，可使用页面底部的撤销恢复');};}
function selectedProjects(){return data.selected.map(id=>data.projects.find(p=>p.id===id)).filter(Boolean);}
function orbitMarkup(){const list=selectedProjects();return `<div class="orbit-preview"><div class="orbit-title"><strong>Portfolio</strong><em>Creativity</em><small>CECILE · SELECTED VISIONS</small></div><div class="ring">${list.map((p,i)=>{let a=(-95+i*360/list.length)*Math.PI/180;return `<img alt="${esc(p.title)}" src="${esc(orbitImg(p))}" style="--x:${Math.cos(a)*185}px;--y:${Math.sin(a)*101}px;--r:${Math.cos(a)*12}deg">`;}).join('')}</div></div>`;}
function card(p,selection){const checked=data.selected.includes(p.id);return `<article class="image-card ${selection&&checked?'selected':''}"><button class="cover-button" data-${selection?'select':'edit'}="${esc(p.id)}" ${selection?`aria-pressed="${checked}"`:''} aria-label="${selection?'选择图片组：':'编辑项目：'}${esc(p.en)}"><img src="${esc(selection?orbitImg(p):img(p))}" alt="${esc(p.title)}" loading="lazy">${selection?'<span class="check">✓</span>':''}</button><div class="card-info"><strong>${esc(p.en)}</strong><small>${esc(p.title)} · ${p.images.length} 张图片</small><div class="card-actions">${selection?`<button data-image="${esc(p.id)}">更换展示图</button><button data-move="${esc(p.id)}" aria-label="将 ${esc(p.en)} 前移" ${!checked||data.selected.indexOf(p.id)===0?'disabled':''}>← 前移</button>`:`<button data-edit="${esc(p.id)}">编辑项目</button><button class="danger" data-delete="${esc(p.id)}">删除</button>`}</div></div></article>`;}
function statusBar(){return `<div class="selection-bar"><span>${page==='portfolio'?`✓ 已选择 ${data.selected.length} 个图片组 · 点击封面选择或取消`:`共 ${data.projects.length} 个项目 · ${data.categories.length} 个分类`}</span>${undo?'<button id="undo">↶ 撤销上次删除</button>':'<span>更改后记得保存 ↗</span>'}</div>`;}
function renderCards(){const list=data.projects.filter(p=>(page==='portfolio'||filter==='all'||p.categoryIds.includes(filter))&&`${p.en} ${p.title}`.toLowerCase().includes(query.toLowerCase()));$('#cards').innerHTML=list.length?list.map(p=>card(p,page==='portfolio')).join(''):'<div class="empty">暂无匹配的项目。尝试其他分类或添加新项目。</div>';}
function render(){const labels={portfolio:['01','Portfolio','首页作品精选','挑选出现在首页旋转画廊中的图片，让第一眼就留下印象。'],work:['02','Selected work','项目与分类','整理你的创作，管理项目与分类，让每件作品找到自己的位置。'],hello:['03','Hello','关于我','更新你的自我介绍，让大家认识作品背后的你。']}[page];$('#breadcrumb').textContent=labels[1];$('#section-number').textContent='CONTENT MANAGEMENT / '+labels[0];$('#page-title').innerHTML=`${labels[1]}<span>${labels[2]}</span>`;$('#page-description').textContent=labels[3];document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===page);b.setAttribute('aria-current',b.dataset.page===page?'page':'false');});
if(page==='portfolio'){$('#content').innerHTML=`<section class="panel"><div class="panel-head"><div><h2>首页旋转画廊</h2><p>ORBIT GALLERY · 图片组与展示顺序预览</p></div><span class="chip">实时预览</span></div><div class="preview-layout">${orbitMarkup()}<div class="preview-settings"><span class="mini-label">SELECTED COLLECTIONS</span><div class="big-number">${String(data.selected.length).padStart(2,'0')}<span>/ ${String(data.projects.length).padStart(2,'0')} 图片组</span></div><p>从项目中挑选图片组，使用所选封面组成首页的环形画廊。</p><div class="divider"></div><span class="mini-label">小提示</span><p>建议选择 5–8 组作品。<br>横竖构图交错，让画廊更有节奏。</p></div></div></section><div class="sub-head"><h2>选择图片组 <span>IMAGE COLLECTIONS</span></h2><input class="search" id="search" aria-label="搜索图片组" placeholder="⌕  搜索图片组" value="${esc(query)}"></div><div class="cards" id="cards"></div>${statusBar()}`;renderCards();}
else if(page==='work'){$('#content').innerHTML=`<section class="panel"><div class="panel-head"><div><h2>分类按钮</h2><p>分类名称将用于作品页的筛选按钮，All work 为固定入口。</p></div><button id="add-category">＋ 新增分类</button></div><div class="category-bar"><button data-filter="all" class="${filter==='all'?'active':''}">All work</button>${data.categories.map(c=>`<div class="category-item"><button data-filter="${esc(c.id)}" class="${filter===c.id?'active':''}">${esc(c.name)} <span> ${data.projects.filter(p=>p.categoryIds.includes(c.id)).length}</span></button><button aria-label="删除分类 ${esc(c.name)}" data-delete-category="${esc(c.id)}">×</button></div>`).join('')}</div></section><div class="sub-head"><h2>项目列表 <span>${data.projects.length} PROJECTS</span></h2><div style="display:flex;gap:10px"><input class="search" id="search" aria-label="搜索项目" placeholder="⌕  搜索项目" value="${esc(query)}"><button class="primary" id="add-project">＋ 新增项目</button></div></div><div class="cards" id="cards"></div>${statusBar()}`;renderCards();}
else renderHello();$('#search')?.addEventListener('input',e=>{query=e.target.value;renderCards();});}
const helloFields=[['greeting','问候语'],['name','名字 / 自我介绍'],['educationTitle','教育板块标题'],['school','毕业院校'],['major','专业'],['expertiseTitle','专长板块标题'],['expertise','个人专长'],['contactTitle','联系板块标题'],['email','电子邮箱'],['wechat','微信号']];
function helloPreview(){const h=data.hello;return `<div class="mini-label">HELLO SECTION <span>实时文字预览 ↗</span></div><h2>${esc(h.greeting)}<span>${esc(h.name)}</span></h2><h3>${esc(h.educationTitle)}</h3><p>${esc(h.school)}<br>${esc(h.major)}</p><h3>${esc(h.expertiseTitle)}</h3><p>${esc(h.expertise)}</p><h3>${esc(h.contactTitle)}</h3><p>${esc(h.email)}<br>wechat: ${esc(h.wechat)}</p>`;}
function renderHello(){$('#content').innerHTML=`<div class="form-layout"><section class="panel"><div class="panel-head"><h2>编辑文字</h2><span class="chip">ABOUT & CONTACT</span></div><div class="form-body">${helloFields.map(([key,label])=>`<label class="field">${label}${key==='expertise'?`<textarea data-hello="${key}" maxlength="1000">${esc(data.hello[key])}</textarea>`:`<input data-hello="${key}" type="${key==='email'?'email':'text'}" maxlength="150" value="${esc(data.hello[key])}">`}</label>`).join('')}</div></section><section class="panel" style="align-self:start;position:sticky;top:22px"><div class="hello-preview" id="hello-preview">${helloPreview()}</div><div class="panel-head"><p>文字会即时反映在预览中，保存后保留在本机。</p></div></section></div>`;document.querySelectorAll('[data-hello]').forEach(el=>el.oninput=()=>{data.hello[el.dataset.hello]=el.value;changed();$('#hello-preview').innerHTML=helloPreview();});}
function editProject(id){
 const p=data.projects.find(p=>p.id===id);
 let images=structuredClone(p?.images||[]), coverIndex=Math.max(0,images.findIndex(im=>im.src===p?.cover)), busy=false, alive=true;
 openModal(`<h2>${p?'编辑项目':'新增项目'}</h2><p>设置项目信息，添加多张图片，并选择一张作为封面。</p><form id="project-form"><label class="field">英文项目名<input name="en" required maxlength="80" value="${esc(p?.en||'')}" placeholder="PROJECT NAME"></label><label class="field">中文项目名<input name="title" required maxlength="80" value="${esc(p?.title||'')}" placeholder="为作品起一个名字"></label><label class="field">项目介绍<textarea name="summary" maxlength="2000">${esc(p?.summary||'')}</textarea></label><label class="field">项目分类<select name="category"><option value="">未分类</option>${data.categories.map(c=>`<option value="${esc(c.id)}" ${p?.categoryIds.includes(c.id)?'selected':''}>${esc(c.name)}</option>`).join('')}</select></label><div class="upload-heading"><span>项目图片</span><span id="upload-count" aria-live="polite"></span></div><div class="upload-zone" id="upload-zone"><span class="upload-icon" aria-hidden="true">↑</span><strong>将图片拖到这里，或点击选择</strong><span>支持一次多选，也可以分批添加</span><label class="upload-button">选择图片<input id="project-files" type="file" multiple accept="image/jpeg,image/png,image/webp" aria-label="选择项目图片（可多选）"></label><small>JPG、PNG、WebP · 每张不超过 10MB · 原图无压缩</small></div><p class="upload-hint">选中后显示缩略图，可设为封面或移除。图片仅保存于当前浏览器。</p><div id="upload-grid" class="upload-grid"></div><p id="form-error" role="alert"></p><div class="modal-actions"><button type="button" data-close>取消</button><button type="submit" class="primary" id="project-submit">${p?'保存项目':'创建项目'}</button></div></form>`);
 const form=$('#project-form'),zone=$('#upload-zone'),input=$('#project-files'),grid=$('#upload-grid'),error=$('#form-error'),submit=$('#project-submit'),modal=$('#modal');
 function renderImages(){
  $('#upload-count').textContent=`已选 ${images.length} 张`;
  grid.innerHTML=images.map((im,i)=>`<div class="upload-tile ${i===coverIndex?'is-cover':''}"><img src="${esc(im.thumb||im.src)}" alt="${esc(im.original||im.label||'项目图片')}" loading="lazy"><span class="upload-filename" title="${esc(im.original||im.label)}">${esc(im.original||im.label||`图片 ${i+1}`)}</span><div><button type="button" data-cover-index="${i}" aria-pressed="${i===coverIndex}">${i===coverIndex?'✓ 封面':'设为封面'}</button><button type="button" data-remove-index="${i}" aria-label="移除图片 ${i+1}" class="danger">移除</button></div></div>`).join('');
 }
 grid.onclick=e=>{const b=e.target.closest('button');if(!b||busy)return;if(b.dataset.coverIndex!==undefined)coverIndex=Number(b.dataset.coverIndex);if(b.dataset.removeIndex!==undefined){const i=Number(b.dataset.removeIndex);images.splice(i,1);if(i<coverIndex)coverIndex--;else if(i===coverIndex)coverIndex=0;}renderImages();};
 async function addFiles(files){
  if(busy||!alive)return;
  const list=Array.from(files);if(!list.length)return;
  busy=true;input.disabled=true;submit.disabled=true;zone.setAttribute('aria-busy','true');error.textContent='正在读取图片…';const errors=[];
  for(const file of list){
   if(!alive)break;
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)){errors.push(`${file.name}：仅支持 JPG、PNG 或 WebP`);continue;}
   if(file.size>10*1024*1024){errors.push(`${file.name}：超过 10MB`);continue;}
   const key=[file.name,file.size,file.lastModified].join(':');if(images.some(im=>im.uploadKey===key))continue;
   try{
    const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('读取失败'));r.readAsDataURL(file);});
    const dimensions=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve({width:im.naturalWidth,height:im.naturalHeight});im.onerror=()=>reject(new Error('图片损坏'));im.src=src;});
    if(!alive)break;
    images.push({src,thumb:src,type:'image',label:file.name,original:file.name,uploadKey:key,...dimensions});renderImages();
   }catch{errors.push(`${file.name}：无法读取，请换一张图片`);}
  }
  if(!alive)return;
  busy=false;input.disabled=false;submit.disabled=false;zone.removeAttribute('aria-busy');input.value='';error.textContent=errors.join('；');renderImages();
 }
 input.onchange=()=>addFiles(input.files);
 let dragDepth=0;
 const dragEnter=e=>{e.preventDefault();dragDepth++;zone.classList.add('is-dragging');};
 const dragOver=e=>{e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect=busy?'none':'copy';};
 const dragLeave=e=>{e.preventDefault();if(--dragDepth<=0){dragDepth=0;zone.classList.remove('is-dragging');}};
 const drop=e=>{e.preventDefault();dragDepth=0;zone.classList.remove('is-dragging');if(busy){error.textContent='正在读取上一批图片，请稍候再拖入。';return;}addFiles(e.dataTransfer?.files||[]);};
 modal.addEventListener('dragenter',dragEnter);modal.addEventListener('dragover',dragOver);modal.addEventListener('dragleave',dragLeave);modal.addEventListener('drop',drop);
 modal.addEventListener('close',()=>{alive=false;modal.removeEventListener('dragenter',dragEnter);modal.removeEventListener('dragover',dragOver);modal.removeEventListener('dragleave',dragLeave);modal.removeEventListener('drop',drop);},{once:true});
 form.onsubmit=e=>{
  e.preventDefault();if(busy)return;
  const fd=new FormData(form),en=fd.get('en').trim(),title=fd.get('title').trim();
  if(!en||!title){error.textContent='项目名称不能只包含空格。';return;}
  if(!images.length){error.textContent='请至少选择一张项目图片。';return;}
  const category=fd.get('category'),cover=images[coverIndex]||images[0];
  const updated={...(p||{id:'project-'+crypto.randomUUID(),videos:[],tags:[]}),en,title,summary:fd.get('summary').trim(),images,cover:cover.src,coverThumb:cover.thumb||cover.src,categoryIds:category?[category]:[]};
  if(p&&category===(p.categoryIds[0]||''))updated.categoryIds=p.categoryIds;
  if(updated.orbitCover&&!images.some(im=>(im.thumb||im.src)===updated.orbitCover))delete updated.orbitCover;
  if(p)data.projects[data.projects.indexOf(p)]=updated;else data.projects.push(updated);
  changed();modal.close();render();toast(p?'项目已更新':`已添加项目，共 ${images.length} 张图片`);
 };
 renderImages();
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
