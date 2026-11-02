'use strict';
// Re-encode only after explicit consent. Original files are never modified.
window.compressPortfolioVideo=async function(file,{signal,onProgress=()=>{},preview}={}){
 const video=document.createElement('video');
 if(!window.MediaRecorder||!video.captureStream)throw new Error('当前浏览器不支持压缩，请使用最新版 Chrome，或先在本机压缩后上传。');
 const mime=['video/mp4;codecs=avc1.42001E,mp4a.40.2','video/webm;codecs=vp8,opus'].find(t=>MediaRecorder.isTypeSupported(t));
 if(!mime)throw new Error('当前浏览器没有可用的视频编码器，请先在本机压缩后上传。');
 const url=URL.createObjectURL(file);let stream,recorder,timer,tick,abort;
 video.muted=true;video.playsInline=true;video.preload='auto';video.className='compression-preview';preview?.append(video);
 try{
  await new Promise((resolve,reject)=>{
   const stop=()=>{clearTimeout(timer);video.onloadeddata=null;video.onerror=null;signal?.removeEventListener('abort',abort);};
   abort=()=>{stop();reject(new Error('已取消压缩，原文件未修改'));};
   if(signal?.aborted)return abort();
   signal?.addEventListener('abort',abort,{once:true});
   timer=setTimeout(()=>{stop();reject(new Error('视频读取超时'));},30000);
   video.onloadeddata=()=>{stop();resolve();};video.onerror=()=>{stop();reject(new Error('无法解码视频，请使用 H.264 编码 MP4'));};video.src=url;
  });
  const duration=video.duration;
  if(!Number.isFinite(duration)||duration<=0||!video.videoWidth)throw new Error('无法读取完整视频时长，未进行压缩。');
  // Reserve room for variable bitrate and container overhead below the 100MB limit.
  const totalRate=Math.floor(95000000*8/duration*.92),audioRate=128000;
  if(totalRate-audioRate<100000)throw new Error('视频太长，压缩到 95MB 会严重损失画质，请先分段再上传。');
  stream=video.captureStream();
  if(!stream.getVideoTracks().length)throw new Error('无法捕获视频画面，未进行压缩。');
  const hasAudio=stream.getAudioTracks().length>0;
  recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:Math.min(40000000,totalRate-(hasAudio?audioRate:0)),audioBitsPerSecond:audioRate});
  const result=await new Promise((resolve,reject)=>{
   let chunks=[],bytes=0,finished=false,complete=false;
   const fail=message=>{if(finished)return;finished=true;chunks=[];reject(new Error(message));};
   abort=()=>fail('已取消压缩，原文件未修改');
   if(signal?.aborted)return abort();signal?.addEventListener('abort',abort,{once:true});
   recorder.ondataavailable=e=>{if(finished)return;if(e.data.size){bytes+=e.data.size;if(bytes>100000000){fail('压缩结果仍超过 100MB，未添加。请缩短视频或先在本机压缩。');return;}chunks.push(e.data);}};
   recorder.onerror=()=>fail('视频编码失败，原文件未修改');video.onerror=()=>fail('视频播放中断，未添加不完整文件');
   recorder.onstop=()=>{if(finished)return;if(!complete||!bytes){fail('视频未完整压缩，未添加文件');return;}finished=true;resolve(new Blob(chunks,{type:mime.split(';')[0]}));};
   video.onended=()=>{complete=true;if(recorder.state!=='inactive')recorder.stop();};
   tick=setInterval(()=>onProgress(Math.min(99,Math.floor(video.currentTime/duration*100))),500);
   timer=setTimeout(()=>fail('压缩超时，请保持此页面在前台后重试'),duration*2000+60000);
   recorder.start(1000);video.play().catch(()=>fail('无法开始处理，请保持此页面在前台后重试'));
  });
  onProgress(100);
  return new File([result],file.name.replace(/\.[^.]+$/,'')+'-compressed.'+(result.type==='video/mp4'?'mp4':'webm'),{type:result.type});
 }finally{
  clearTimeout(timer);clearInterval(tick);signal?.removeEventListener('abort',abort);
  video.onended=null;video.onerror=null;video.pause();
  if(recorder){recorder.ondataavailable=null;recorder.onstop=null;recorder.onerror=null;if(recorder.state!=='inactive')recorder.stop();}
  stream?.getTracks().forEach(t=>t.stop());video.removeAttribute('src');video.load();video.remove();URL.revokeObjectURL(url);
 }
};
