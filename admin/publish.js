'use strict';
const publishRepo='Ceciletttop/Ceciletttop.github.io';
let publishing=false;
const publishAuthKey='cecile-github-publish-token-v1';
let publishSessionToken='';
function readPublishToken(){try{return publishSessionToken||localStorage.getItem(publishAuthKey)||'';}catch{return publishSessionToken;}}
function rememberPublishToken(token){publishSessionToken=token;try{localStorage.setItem(publishAuthKey,token);return true;}catch{return false;}}
function clearPublishToken(){publishSessionToken='';try{localStorage.removeItem(publishAuthKey);}catch{}}

async function preparePublication(snapshot,onMedia){
 const seen=new Map();
 async function visit(value){
  if(typeof value==='string'&&/^data:(image|video)\//.test(value)){
   if(seen.has(value))return seen.get(value);
   const task=(async()=>{const m=value.match(/^data:((?:image\/(?:jpeg|png|webp)|video\/(?:mp4|webm|quicktime)));base64,(.+)$/s);if(!m)throw new Error('媒体格式无效');
    const isVideo=m[1].startsWith('video/'),limit=isVideo?100000000:10*1024*1024;
    const bytes=m[2].length/4*3-(m[2].endsWith('==')?2:m[2].endsWith('=')?1:0);
    if(bytes>limit)throw new Error(isVideo?'视频超过 100MB':'图片超过 10MB');
    const raw=new Uint8Array(bytes);let offset=0;
    // Decode in bounded chunks to avoid a huge array of individual characters.
    for(let start=0;start<m[2].length;start+=1048576){const chunk=atob(m[2].slice(start,start+1048576));for(let i=0;i<chunk.length;i++)raw[offset++]=chunk.charCodeAt(i);}

    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),v=>v.toString(16).padStart(2,'0')).join('');
    const path=`assets/uploads/${digest}.${{'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov'}[m[1]]}`;
    if(isVideo&&bytes>12*1024*1024){
     const parts=[],partBytes=6*1024*1024,partChars=partBytes/3*4;
     for(let start=0,index=0;start<m[2].length;start+=partChars,index++){
      const content=m[2].slice(start,start+partChars),partPath=`assets/uploads/${digest}.part-${index}.bin`;
      await onMedia(partPath,content);parts.push({path:'/'+partPath,size:Math.min(partBytes,bytes-index*partBytes)});
     }
     const manifestPath=`assets/uploads/${digest}.video.json`;
     await onMedia(manifestPath,btoa(JSON.stringify({version:1,type:m[1],size:bytes,sha256:digest,parts})));
     return '/'+manifestPath;
    }
    await onMedia(path,m[2]);return '/'+path;
   })();seen.set(value,task);return task;
  }
  if(Array.isArray(value)){const out=[];for(const x of value)out.push(await visit(x));return out;}
  if(value&&typeof value==='object'){const out={};for(const [k,v] of Object.entries(value))out[k]=await visit(v);return out;}
  return typeof value==='string'&&value.startsWith('../assets/')?'/'+value.slice(3):value;
 }
 return visit(snapshot);
}
function publicationError(path,status,detail){
 const message=String(detail?.message||'').slice(0,500);
 const errors=Array.isArray(detail?.errors)?detail.errors.map(e=>typeof e==='string'?e:e.message||e.code||'').filter(Boolean).join('；').slice(0,500):'';
 const reason=[message,errors].filter(Boolean).join('；');
 if(status===401)return '发布授权已失效，请重新填写有效的 GitHub 令牌。草稿仍保留。';
 if(path==='git/refs/heads/main'&&(status===409||status===422))return '提交网站更新失败：'+(reason||'分支可能已更新，请重试。')+'（草稿仍保留）';
 const stage=path==='git/blobs'?'上传媒体文件':path==='git/trees'?'生成网站文件清单':path==='git/commits'?'创建发布记录':'检查网站版本';
 return `${stage}失败（GitHub ${status}）：${reason||'服务器未提供详细原因'}。草稿仍保留。`;
}
function parsePublishedContent(source){const prefix='window.SITE_CONTENT = ';if(!source.startsWith(prefix))throw new Error('网站配置格式不兼容');return JSON.parse(source.slice(prefix.length).trim().replace(/;$/,''));}
$('#publish').onclick=()=>{
 if(initializing||publishing)return;
 const remembered=Boolean(readPublishToken());
 openModal(`<h2>发布到网站</h2><p>将当前项目、原图、视频、分类和 Hello 文字同步到公开作品集。</p><p id="publish-auth-note">${remembered?'已记住此浏览器的发布授权，可直接发布。':'首次设置一次 GitHub 发布授权，以后可以直接发布。'}</p>${remembered?'<button type="button" id="forget-publish-token">清除已保存的授权</button>':''}<form id="publish-form"><div id="publish-auth-fields" ${remembered?'hidden':''}><p>创建细粒度令牌：Repository access 选择 Only select repositories → Ceciletttop.github.io；Repository permissions 中 Contents 设为 Read and write。请选择有效期，到期后需更新授权。</p><p><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">在 GitHub 创建发布令牌 ↗</a></p><label class="field">GitHub 发布令牌<input type="password" id="publish-token" autocomplete="off" ${remembered?'':'required'} placeholder="仅在这里粘贴令牌"></label><label style="display:flex;align-items:center;gap:8px;font-size:12px"><input type="checkbox" id="remember-publish-token">记住授权（仅限自己的电脑）</label><p>勾选后，令牌保存在此浏览器中，直到清除；同一网站的脚本可读取它。不会写入作品配置或导出文件。</p></div><p id="publish-status" role="status"></p><div class="modal-actions"><button type="button" data-close>取消</button><button type="submit" class="primary">发布更新</button></div></form>`);
 $('#forget-publish-token')?.addEventListener('click',()=>{clearPublishToken();$('#publish').click();toast('已清除此浏览器的发布授权');});
 $('#modal [data-close]').onclick=()=>$('#modal').close();
 $('#publish-form').onsubmit=async e=>{
  e.preventDefault();if(publishing)return;
  publishing=true;const form=e.currentTarget,status=$('#publish-status'),snapshot=structuredClone(data),savedRevision=revision;
  let token=$('#publish-token').value.trim()||readPublishToken();const remember=$('#remember-publish-token').checked;$('#publish-token').value='';
  if(!token){publishing=false;status.textContent='请先填写 GitHub 发布令牌。';return;}
  form.querySelectorAll('button,input').forEach(x=>x.disabled=true);$('#publish').disabled=true;
  const preventClose=e=>e.preventDefault();$('#modal').addEventListener('cancel',preventClose);
  const report=t=>{status.textContent=t;};
  async function api(path,method='GET',body){
   const response=await fetch(`https://api.github.com/repos/${publishRepo}/${path}`,{method,cache:'no-store',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   if(response.status===401){clearPublishToken();}
   if(!response.ok){let detail;try{detail=await response.json();}catch{}throw new Error(publicationError(path,response.status,detail));}
   return response.json();
  }
  let committed=false;
  try{
   report('正在保存草稿并检查网站版本…');if(!draftDB)draftDB=await openDraftDB();await accessDraft('readwrite',snapshot);
   const head=(await api('git/ref/heads/main')).object.sha;
   const current=await api('contents/site-content.js?ref='+head);
   const text=new TextDecoder().decode(Uint8Array.from(atob(current.content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
   const remote=parsePublishedContent(text),expected=snapshot.revision||window.SITE_CONTENT.revision;
   if(remote.revision!==expected)throw new Error('线上已有更新的内容。为保护双方修改，本次没有发布。请先导出当前草稿备份，再在新浏览器窗口查看线上版本并核对。');
   const tree=await api('git/trees/'+head+'?recursive=1');if(tree.truncated)throw new Error('文件清单过大，无法安全确认图片，请联系维护者发布。');
   const exists=new Set(tree.tree.map(x=>x.path)),entries=[];let count=0;
   const output=await preparePublication(snapshot,async(path,content)=>{if(exists.has(path))return;report(`正在上传媒体文件 ${++count}（约 ${(content.length*3/4/1000000).toFixed(1)}MB）…`);const blob=await api('git/blobs','POST',{content,encoding:'base64'});entries.push({path,mode:'100644',type:'blob',sha:blob.sha});exists.add(path);});
   output.revision=crypto.randomUUID();
   entries.push({path:'site-content.js',mode:'100644',type:'blob',content:'window.SITE_CONTENT = '+JSON.stringify(output)+';\n'});
   report('媒体文件已上传，正在提交网站更新…');
   const newTree=await api('git/trees','POST',{base_tree:tree.sha,tree:entries});
   const commit=await api('git/commits','POST',{message:'Publish portfolio content from admin',tree:newTree.sha,parents:[head]});
   await api('git/refs/heads/main','PATCH',{sha:commit.sha,force:false});committed=true;
   if(remember&&!rememberPublishToken(token))toast('发布已提交，但浏览器阻止长期保存授权；本页仍可继续发布');
   // A deployment may take minutes; a submitted commit is not yet a live site.
   window.SITE_CONTENT=output;
   if(revision===savedRevision){data=output;dirty=false;try{await accessDraft('readwrite',data);}catch{dirty=true;}render();}
   else data.revision=output.revision;
   $('#save-state').textContent='● 已提交发布，等待上线';report('内容已提交，正在等待 GitHub Pages 上线。可以关闭此窗口；通常需要数分钟。');
   for(let attempt=0;attempt<36;attempt++){
    await new Promise(resolve=>setTimeout(resolve,5000));
    try{const res=await fetch('/site-content.js?verify='+Date.now(),{cache:'no-store'});if(res.ok&&parsePublishedContent(await res.text()).revision===output.revision){$('#save-state').textContent=dirty?'● 网站已更新，另有未保存更改':'● 网站已更新';report('发布成功，公开网站已确认更新。');return;}}catch{}
   }
   report('已提交发布，但尚未确认上线。请稍后打开公开网站检查，勿重复提交。');
  }catch(error){report(committed?'内容已提交，后续检查未完成，请稍后查看网站。':error.message);}
  finally{token='';publishing=false;form.querySelectorAll('button,input').forEach(x=>x.disabled=false);$('#publish').disabled=false;$('#modal').removeEventListener('cancel',preventClose);const hasAuth=Boolean(readPublishToken());$('#publish-auth-fields').hidden=hasAuth;$('#publish-token').required=!hasAuth;if(!hasAuth)$('#publish-auth-note').textContent='请输入有效的 GitHub 发布授权。';}
 };
};
