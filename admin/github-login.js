'use strict';
// Netlify handles the OAuth exchange. No OAuth client secret belongs in this site.
window.PortfolioLogin=(()=>{
 const siteID='920a619c-1590-4347-bc27-d0a063b6a157',origin='https://api.netlify.com';
 let session=null,pending=null;
 function logout(){session=null;}
 function login(){
  if(session)return Promise.resolve(session);
  if(pending)return pending;
  pending=new Promise((resolve,reject)=>{
   const auth=new netlify.default({site_id:siteID});let timer,handshake,reply,done=false;
   function finish(error,result){if(done)return;done=true;clearInterval(timer);window.removeEventListener('message',handshake);window.removeEventListener('message',reply);auth.authWindow?.close();error?reject(error):resolve(result);}
   // Bind both phases to the exact popup, not just the provider's origin.
   auth.handshakeCallback=()=>handshake=e=>{if(e.origin===origin&&typeof e.data==='string')document.querySelector('#publish-status').textContent='收到登录服务回调：'+(e.source===auth.authWindow?'窗口匹配':'窗口不匹配')+'，'+(e.data==='authorizing:github'?'握手消息':'其他消息');if(e.origin!==origin||e.source!==auth.authWindow||e.data!=='authorizing:github')return;window.removeEventListener('message',handshake);window.addEventListener('message',reply);document.querySelector('#publish-status').textContent='已连接登录窗口，等待 GitHub 授权…';auth.authWindow.postMessage(e.data,origin);};
   reply=async e=>{
    if(e.origin===origin)document.querySelector('#publish-status').textContent='已收到授权响应：'+(e.source===auth.authWindow?'窗口匹配':'窗口不匹配')+'，'+(typeof e.data==='string'?(e.data.startsWith('authorization:github:success:')?'授权完成':e.data.startsWith('authorization:github:error:')?'授权失败':'其他消息'):'非文本响应');
    if(e.origin!==origin||e.source!==auth.authWindow||typeof e.data!=='string')return;
    const prefix='authorization:github:success:';
    if(e.data.startsWith('authorization:github:error:'))return finish(new Error('登录授权未完成，请重试。'));
    if(!e.data.startsWith(prefix))return;
    window.removeEventListener('message',reply);clearInterval(timer);
    try{
     const result=JSON.parse(e.data.slice(prefix.length));if(typeof result.token!=='string'||!result.token)throw Error('登录未返回有效授权。');
     const response=await fetch('https://api.github.com/repos/Ceciletttop/Ceciletttop.github.io',{headers:{Authorization:`Bearer ${result.token}`,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});
     if(!response.ok)throw Error('无法验证发布权限，请重新登录。');
     const repo=await response.json();if(!repo.permissions?.push)throw Error('当前 GitHub 账号没有此作品集的发布权限。');
     session={token:result.token};finish(null,session);
    }catch(error){logout();finish(new Error(error.message==='Failed to fetch'?'网络连接失败，请重新登录。':error.message));}
   };
   try{auth.authenticate({provider:'github',scope:'public_repo'},error=>{if(error)finish(new Error('登录服务尚未配置完成，请联系网站维护者。'));});
    if(!auth.authWindow)return finish(new Error('请允许此网站弹出 GitHub 登录窗口。'));
    const deadline=Date.now()+180000;timer=setInterval(()=>{if(auth.authWindow.closed)finish(new Error('已取消登录，草稿未改变。'));else if(Date.now()>deadline)finish(new Error('登录超时，请重试。'));},500);
   }catch{finish(new Error('无法打开登录窗口，请允许弹出窗口后重试。'));}
  }).finally(()=>{pending=null;});return pending;
 }
 return {login,logout,isLoggedIn:()=>Boolean(session)};
})();
