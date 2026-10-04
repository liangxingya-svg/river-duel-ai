(()=>{'use strict';
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};
function card(c,{button=false,selected=false}={}){
 const r=c===undefined?'':c>=52?'JOKER':['2','3','4','5','6','7','8','9','10','J','Q','K','A'][c%13],s=c===undefined?'♠':c>=52?'★':['♣','♦','♥','♠'][Math.floor(c/13)],n=el(button?'button':'span','card'+(c===undefined?' back':c>=52?' joker':'')+((c===53||c<39&&c>=13)?' red':''));
 if(c!==undefined)n.dataset.card=c;
 if(button){n.type='button';n.setAttribute('aria-label',c===52?'小王':c===53?'大王':s+r);n.setAttribute('aria-pressed',String(selected))}
 if(c!==undefined){const a=el('span');a.append(el('span','rank',r),el('span','corner',s));n.append(a)}
 n.append(el('span','suit',s));return n;
}
function fit(container){
 const fan=container.querySelector('.played-fan'),cards=fan?.querySelectorAll('.card');if(!cards?.length)return;
 const width=container.clientWidth,cardWidth=cards[0].getBoundingClientRect().width;
 // Never hide the start of an overflowing hand by centering a flex row.
 const step=cards.length>1?Math.min(cardWidth-9,Math.max(15,(width-cardWidth)/(cards.length-1))):cardWidth;
 fan.style.setProperty('--played-overlap',(step-cardWidth)+'px');
}
function mount(container,cards,{label='出牌',onOpen}={}){
 const strip=el('div','played-cards'),fan=el('div','played-fan'),meta=el('div','played-meta',label+' · '+cards.length+'张 ↗');
 fan.append(...cards);strip.append(fan);container.replaceChildren(strip,meta);strip.scrollLeft=0;
 container.setAttribute('role','button');container.tabIndex=0;container.setAttribute('aria-label',label+'，'+cards.length+'张，查看完整出牌');
 container.onclick=onOpen;container.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onOpen?.()}};fit(container);
}
window.DoudizhuCards={card,mount,fit};
})();
