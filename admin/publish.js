'use strict';
const publishRepo='Ceciletttop/Ceciletttop.github.io';
let publishing=false;
async function preparePublication(snapshot,onImage){
 const seen=new Map();
 async function visit(value){
  if(typeof value==='string'&&value.startsWith('data:image/')){
   if(seen.has(value))return seen.get(value);
   const task=(async()=>{const m=value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s);if(!m)throw new Error('图片格式无效');
    const raw=Uint8Array.from(atob(m[2]),c=>c.charCodeAt(0));if(raw.length>10*1024*1024)throw new Error('图片超过 10MB');
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),v=>v.toString(16).padStart(2,'0')).join('');
    const path=`assets/uploads/${digest}.${{'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[m[1]]}`;
    await onImage(path,m[2]);return '/'+path;
   })();seen.set(value,task);return task;
  }
  if(Array.isArray(value)){const out=[];for(const x of value)out.push(await visit(x));return out;}
  if(value&&typeof value==='object'){const out={};for(const [k,v] of Object.entries(value))out[k]=await visit(v);return out;}
  return typeof value==='string'&&value.startsWith('../assets/')?'/'+value.slice(3):value;
 }
 return visit(snapshot);
}
function parsePublishedContent(source){const prefix='window.SITE_CONTENT = ';if(!source.startsWith(prefix))throw new Error('网站配置格式不兼容');return JSON.parse(source.slice(prefix.length).trim().replace(/;$/,''));}
$('#publish').onclick=()=>{
 if(initializing||publishing)return;
 openModal(`<h2>发布到网站</h2><p>将当前项目、原图、分类和 Hello 文字发布到公开作品集。保存草稿只保留在当前浏览器。</p><p>首次发布需要 GitHub 授权：创建仅允许访问 Ceciletttop.github.io 仓库、Contents（内容）读写权限的细粒度令牌。令牌仅用于本次发布，不保存到浏览器或网站文件。</p><p><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">在 GitHub 创建发布令牌 ↗</a></p><form id="publish-form"><label class="field">GitHub 发布令牌<input type="password" id="publish-token" autocomplete="off" required placeholder="粘贴令牌，仅本次使用"></label><p id="publish-status" role="status"></p><div class="modal-actions"><button type="button" data-close>取消</button><button type="submit" class="primary">确认发布</button></div></form>`);
 $('#modal [data-close]').onclick=()=>$('#modal').close();
 $('#publish-form').onsubmit=async e=>{
  e.preventDefault();if(publishing)return;
  publishing=true;const form=e.currentTarget,status=$('#publish-status'),snapshot=structuredClone(data),savedRevision=revision;
  let token=$('#publish-token').value.trim();$('#publish-token').value='';
  form.querySelectorAll('button,input').forEach(x=>x.disabled=true);$('#publish').disabled=true;
  const preventClose=e=>e.preventDefault();$('#modal').addEventListener('cancel',preventClose);
  const report=t=>{status.textContent=t;};
  async function api(path,method='GET',body){
   const response=await fetch(`https://api.github.com/repos/${publishRepo}/${path}`,{method,headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
   if(!response.ok)throw new Error(response.status===401||response.status===403?'授权失败，请检查令牌是否有效，并拥有此仓库的 Contents 读写权限。':response.status===409||response.status===422?'网站刚被其他操作更新，本次未覆盖；请刷新检查后重试。':`发布请求失败（${response.status}），草稿仍保留。`);
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
   const output=await preparePublication(snapshot,async(path,content)=>{if(exists.has(path))return;report(`正在上传原图 ${++count}…（不压缩）`);const blob=await api('git/blobs','POST',{content,encoding:'base64'});entries.push({path,mode:'100644',type:'blob',sha:blob.sha});exists.add(path);});
   output.revision=crypto.randomUUID();
   entries.push({path:'site-content.js',mode:'100644',type:'blob',content:'window.SITE_CONTENT = '+JSON.stringify(output)+';\n'});
   report('原图已上传，正在提交网站更新…');
   const newTree=await api('git/trees','POST',{base_tree:tree.sha,tree:entries});
   const commit=await api('git/commits','POST',{message:'Publish portfolio content from admin',tree:newTree.sha,parents:[head]});
   await api('git/refs/heads/main','PATCH',{sha:commit.sha,force:false});committed=true;
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
  finally{token='';publishing=false;form.querySelectorAll('button,input').forEach(x=>x.disabled=false);$('#publish').disabled=false;$('#modal').removeEventListener('cancel',preventClose);}
 };
};
