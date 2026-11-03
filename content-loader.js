(()=>{
 'use strict';
 const c=window.SITE_CONTENT;if(!c)return;

function applyPortfolioText(text={}){
 const heading=document.querySelector('.hero-heading h1');if(!heading)return;
 let title=heading.querySelector('.hero-title-text');
 if(!title){title=document.createElement('span');title.className='hero-title-text';title.style.color='inherit';const node=heading.firstChild;title.textContent=node?.textContent||'';if(node)node.replaceWith(title);else heading.prepend(title);}
 const nodes={title,subtitle:heading.querySelector('.hero-bottom-line>span:not(.hero-year)'),year:heading.querySelector('.hero-year')};
 const defaults={title:'Portfolio',subtitle:'Creativity',year:'2026'};
 for(const key of Object.keys(nodes)){if(nodes[key]){nodes[key].textContent=String(text[key]??defaults[key]);nodes[key].dataset.heroText=key;}}
 return nodes;
}

applyPortfolioText(c.portfolio);
 window.PORTFOLIO_PROJECTS=c.projects.map(p=>({...p,tags:p.tags||[],videos:p.videos||[],category:(p.categoryIds||[]).map(id=>c.categories.find(x=>x.id===id)?.name).filter(Boolean).join(' / ')}));
 const h=c.hello,put=(s,t)=>{const el=document.querySelector(s);if(el)el.textContent=t||'';};
 const greeting=document.querySelector('#about-greeting');if(greeting){greeting.textContent=h.greeting;const span=document.createElement('span');span.textContent=h.name;greeting.append(span);}
 const blocks=Array.isArray(h.blocks)?h.blocks:[{title:h.educationTitle,content:[h.school,h.major].filter(Boolean).join('\n')},{title:h.expertiseTitle,content:h.expertise},{title:h.contactTitle,content:[h.email,h.wechat?'wechat: '+h.wechat:''].filter(Boolean).join('\n')}];
 const meta=document.querySelector('.about-meta');if(meta){meta.replaceChildren();meta.classList.add('about-custom-blocks');for(const block of blocks){const section=document.createElement('section'),title=document.createElement('h3'),body=document.createElement('p');title.className='about-block-title';title.textContent=block.title||'';body.className='about-block-content';for(const [i,line] of String(block.content||'').split('\n').entries()){if(i)body.append(document.createElement('br'));if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line.trim())){const a=document.createElement('a');a.textContent=line;a.href='mailto:'+line.trim();body.append(a);}else body.append(document.createTextNode(line));}section.append(title,body);meta.append(section);}}
 window.HelloCanvas?.publish(h);
 put('#main-menu a[href="#selected"] span',String(c.projects.length).padStart(2,'0'));
})();
