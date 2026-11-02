(()=>{
 'use strict';
 const c=window.SITE_CONTENT;if(!c)return;
 window.PORTFOLIO_PROJECTS=c.projects.map(p=>({...p,tags:p.tags||[],videos:p.videos||[],category:(p.categoryIds||[]).map(id=>c.categories.find(x=>x.id===id)?.name).filter(Boolean).join(' / ')}));
 const h=c.hello,put=(s,t)=>{const el=document.querySelector(s);if(el)el.textContent=t||'';};
 const greeting=document.querySelector('#about-greeting');if(greeting){greeting.textContent=h.greeting;const span=document.createElement('span');span.textContent=h.name;greeting.append(span);}
 for(const [s,k] of [['#education-title','educationTitle'],['.about-college','school'],['.about-education p:last-child','major'],['#strengths-title','expertiseTitle'],['.about-strengths p','expertise'],['#contact-title','contactTitle'],['.about-contact-list a','email']])put(s,h[k]);
 const email=document.querySelector('.about-contact-list a');if(email)email.href='mailto:'+h.email;
 put('.about-contact-list > span','wechat: '+h.wechat);put('#main-menu a[href="#selected"] span',String(c.projects.length).padStart(2,'0'));
})();
