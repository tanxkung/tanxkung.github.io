/* Controller follows the existing 1920×1080 teaching deck navigation pattern. */
(() => {
 'use strict';
 const byId=id=>document.getElementById(id), slides=[...document.querySelectorAll('.slide')];
 const data=JSON.parse(byId('sourceData').textContent),stage=byId('deckStage');let current=0,editing=false;
 const pad=n=>String(n).padStart(2,'0');
 function fitText(){document.querySelectorAll('.source-text').forEach(box=>{
  const inner=box.querySelector('.text-fit'),style=getComputedStyle(box),padding={top:parseFloat(style.paddingTop)||0,right:parseFloat(style.paddingRight)||0,bottom:parseFloat(style.paddingBottom)||0,left:parseFloat(style.paddingLeft)||0};
  const width=Math.max(0,box.clientWidth-padding.left-padding.right),height=Math.max(0,box.clientHeight-padding.top-padding.bottom);
  inner.style.transform='none';inner.style.width=`${width}px`;inner.style.left=`${padding.left}px`;inner.style.top=`${padding.top}px`;
  if(!width||!height){box.dataset.fitStatus='unmeasured';return;}
  const measuredWidth=Math.max(width,inner.scrollWidth),measuredHeight=inner.scrollHeight,ratio=Math.min(1,width/measuredWidth,height/Math.max(1,measuredHeight));
  const remaining=Math.max(0,height-measuredHeight*ratio),offset=style.justifyContent==='center'?remaining/2:style.justifyContent==='flex-end'?remaining:0;
  inner.style.top=`${padding.top+offset}px`;inner.style.transform=`scale(${ratio})`;box.dataset.fitScale=String(ratio);
  const bounds=box.getBoundingClientRect(),text=inner.getBoundingClientRect(),sx=bounds.width/box.clientWidth,sy=bounds.height/box.clientHeight;
  const fits=text.left>=bounds.left+padding.left*sx-1&&text.top>=bounds.top+padding.top*sy-1&&text.right<=bounds.right-padding.right*sx+1&&text.bottom<=bounds.bottom-padding.bottom*sy+1;
  box.dataset.fitStatus=fits?'fits':'overflow';
 });}
 function scaleStage(){const frame=document.querySelector('.deck-viewport'),factor=Math.min(frame.clientWidth/1920,frame.clientHeight/1080);stage.style.transform=`translate(${(frame.clientWidth-1920*factor)/2}px,${(frame.clientHeight-1080*factor)/2}px) scale(${factor})`;}
 function closePanels(){[byId('chapterMenu'),byId('notesPanel')].forEach(p=>{if(p.open)p.close();});}
 function show(index,updateHash=true){current=Math.max(0,Math.min(index,slides.length-1));slides.forEach((s,i)=>{s.classList.toggle('active',i===current);s.setAttribute('aria-hidden',i===current?'false':'true');s.inert=i!==current;});byId('counter').textContent=`${pad(current+1)} / ${slides.length}`;byId('progress').style.width=`${(current+1)/slides.length*100}%`;byId('prevBtn').disabled=current===0;byId('nextBtn').disabled=current===slides.length-1;if(updateHash)history.replaceState(null,'',`#slide-${current+1}`);}
 function fromHash(){const m=location.hash.match(/^#(?:slide-)?(\d+)$/);return m?Number(m[1])-1:0;}
 function menu(){closePanels();byId('chapterMenu').showModal();}
 function notes(){closePanels();const d=data[current],holder=byId('notesContent');holder.replaceChildren();const note=document.createElement('p');note.textContent=d.notes||'原簡報此頁沒有講者備註。';holder.append(note);if(d.links.length){const heading=document.createElement('h3');heading.textContent='原始連結（含影片／來源）';holder.append(heading);const list=document.createElement('ul');d.links.forEach(url=>{const li=document.createElement('li'),a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=url;li.append(a);list.append(li);});holder.append(list);}const meta=document.createElement('p');meta.className='source-note';meta.textContent='由已上傳 PPT 成品轉製；備註獨立呈現，非投影片正文。';holder.append(meta);byId('notesPanel').showModal();}
 function toggleEditing(){if(!byId('editBtn'))return;editing=!editing;document.body.classList.toggle('editing',editing);document.querySelectorAll('[data-editable]').forEach(el=>el.contentEditable=editing?'true':'false');byId('editBtn').textContent=editing?'結束編輯 E':'文字編輯 E';if(!editing)fitText();}
 byId('menuLinks').replaceChildren();
 slides.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${pad(i+1)}　${s.dataset.title}`;b.onclick=()=>{show(i);closePanels();};byId('menuLinks').append(b);});
 byId('prevBtn').onclick=()=>show(current-1);byId('nextBtn').onclick=()=>show(current+1);byId('menuBtn').onclick=menu;byId('notesBtn').onclick=notes;if(byId('editBtn'))byId('editBtn').onclick=toggleEditing;
 if(byId('saveBtn'))byId('saveBtn').onclick=()=>{if(editing)toggleEditing();closePanels();const copy=document.documentElement.cloneNode(true);copy.querySelector('#menuLinks').replaceChildren();copy.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));const url=URL.createObjectURL(new Blob(['<!doctype html>\n'+copy.outerHTML],{type:'text/html;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=location.pathname.split('/').pop().replace('.html','-edited.html');a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 byId('fullBtn').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closePanels);
 document.addEventListener('keydown',e=>{if(e.target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName))return;if(e.key==='Escape'){closePanels();return;}if(byId('chapterMenu').open||byId('notesPanel').open)return;if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){if(e.key===' '&&/^(BUTTON|A)$/.test(e.target?.tagName))return;e.preventDefault();show(current+1);}else if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();show(current-1);}else if(e.key==='Home')show(0);else if(e.key==='End')show(slides.length-1);else if(e.key.toLowerCase()==='m')menu();else if(e.key.toLowerCase()==='n')notes();else if(e.key.toLowerCase()==='e')toggleEditing();});
 window.addEventListener('resize',scaleStage);window.addEventListener('hashchange',()=>show(fromHash(),false));show(fromHash(),false);scaleStage();(document.fonts?.ready||Promise.resolve()).then(fitText);
})();
