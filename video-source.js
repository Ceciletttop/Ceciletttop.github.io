/* Large videos are stored as small GitHub files and restored byte-for-byte for playback. */
(()=>{
 'use strict';
 const records=new Map(),active=new Set();
 async function load(src){
  const response=await fetch(src);if(!response.ok)throw new Error('视频清单加载失败');
  const manifest=await response.json();
  if(manifest.version!==1||!['video/mp4','video/webm','video/quicktime'].includes(manifest.type)||!Array.isArray(manifest.parts)||manifest.parts.length>20||manifest.size>100000000)throw new Error('视频清单无效');
  const chunks=[];let size=0;
  for(const part of manifest.parts){
   if(!/^\/assets\/uploads\/[a-f0-9]{64}\.part-\d+\.bin$/.test(part.path))throw new Error('视频分段地址无效');
   const res=await fetch(part.path);if(!res.ok)throw new Error('视频分段加载失败');
   const bytes=await res.arrayBuffer();if(bytes.byteLength!==part.size)throw new Error('视频分段不完整');
   chunks.push(bytes);size+=bytes.byteLength;if(size>100000000)throw new Error('视频大小无效');
  }
  if(size!==manifest.size)throw new Error('视频文件不完整');
  const blob=new Blob(chunks,{type:manifest.type});
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),x=>x.toString(16).padStart(2,'0')).join('');
  if(hash!==manifest.sha256)throw new Error('视频完整性检查失败');
  return blob;
 }
 window.attachPortfolioVideo=(video,src,shouldPlay=()=>false)=>{
  if(video.dataset.mediaSource===src)return;
  video.dataset.mediaSource=src;
  if(!src.endsWith('.video.json')){video.src=src;return;}
  const entry={video,url:null,seen:video.isConnected};active.add(entry);
  video.setAttribute('aria-label','视频正在加载');
  const status=document.createElement('span');status.textContent='视频加载中…';status.style.cssText='position:absolute;left:12px;bottom:12px;z-index:3;padding:6px 10px;border-radius:4px;background:#000b;color:white;font-size:12px;pointer-events:none';video.parentElement?.append(status);entry.status=status;
  if(!records.has(src))records.set(src,load(src));
  const pending=records.get(src);
  pending.then(blob=>{if(!active.has(entry))return;entry.url=URL.createObjectURL(blob);video.src=entry.url;video.removeAttribute('aria-label');status.remove();if(shouldPlay())video.play().catch(()=>{});}).catch(()=>{if(active.has(entry)){status.textContent='视频加载失败，请刷新重试';video.setAttribute('aria-label','视频加载失败，请刷新重试');}}).finally(()=>{if(records.get(src)===pending)records.delete(src);});
 };
 new MutationObserver(()=>{for(const e of active){if(e.video.isConnected)e.seen=true;else if(e.seen){if(e.url)URL.revokeObjectURL(e.url);e.status.remove();active.delete(e);}}}).observe(document.documentElement,{childList:true,subtree:true});
})();
