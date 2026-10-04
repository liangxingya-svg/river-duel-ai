(function(root){'use strict';
const hit=(a,b)=>a.left<b.left+b.width+2&&a.left+a.width+2>b.left&&a.top<b.top+b.height+2&&a.top+a.height+2>b.top;
function place(initial,bounds,obstacles){
 const safe=p=>p.left>=bounds.left&&p.top>=bounds.top&&p.left+p.width<=bounds.left+bounds.width&&p.top+p.height<=bounds.top+bounds.height&&!obstacles.some(o=>hit(p,o));
 if(safe(initial))return initial;
 let best=null,score=Infinity;
 // Search near the preferred seat anchor first; scan the felt as fallback.
 const test=(left,top)=>{const p={...initial,left,top};if(!safe(p))return;const d=(left-initial.left)**2+(top-initial.top)**2;if(d<score){best=p;score=d}};
 for(let d=4;d<=64;d+=4)for(const [x,y]of [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]])test(initial.left+x*d,initial.top+y*d);
 if(best)return best;
 for(let y=bounds.top;y+initial.height<=bounds.top+bounds.height;y+=8)for(let x=bounds.left;x+initial.width<=bounds.left+bounds.width;x+=8)test(x,y);
 return best;
}
const api={place,hit};root.BetLayout=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
