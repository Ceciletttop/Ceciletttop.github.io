(()=>{
  'use strict';
  const key='cecile-theme';
  let current='light';
  try{current=localStorage.getItem(key)||window.parent.document.documentElement.dataset.theme||'light';}catch{}
  function apply(theme){
    current=theme==='dark'?'dark':'light';
    const dark=current==='dark';
    document.documentElement.dataset.theme=current;
    document.documentElement.style.colorScheme=current;
    document.body?.classList.toggle('dark',dark);
    document.querySelectorAll('#theme-toggle,[data-theme-toggle]').forEach(button=>{
      button.setAttribute('aria-pressed',String(dark));
      button.setAttribute('aria-label',dark?'切换浅色外观':'切换深色外观');
      button.textContent=dark?'☀':'☾';
    });
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.content=dark?'#151515':'#ffffff';
  }
  function set(theme){apply(theme);try{localStorage.setItem(key,current);}catch{}}
  window.CecileTheme={set,get:()=>current,toggle:()=>set(current==='dark'?'light':'dark')};
  apply(current);
  document.addEventListener('DOMContentLoaded',()=>apply(current),{once:true});
  document.addEventListener('click',event=>{if(event.target.closest('#theme-toggle,[data-theme-toggle]'))window.CecileTheme.toggle();});
  window.addEventListener('storage',event=>{if(event.key===key)apply(event.newValue);});
})();
