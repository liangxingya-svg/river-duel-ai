(function(root){'use strict';
// Uses only public cards. Percentages include equal shares of ties; side-pot payouts are separate.
function estimate(players,board=[],samples=400,rng=Math.random){
 const active=players.map((p,i)=>({...p,index:i})).filter(p=>p.inHand!==false&&!p.folded);
 if(active.length<2||active.some(p=>p.hole?.length!==2||p.hole.some(c=>!Number.isInteger(c)||c<0||c>51)))return null;
 const known=[...board,...players.flatMap(p=>p.hole?.length===2&&p.hole.every(c=>Number.isInteger(c))?p.hole:[])];if(new Set(known).size!==known.length)return null;
 const remaining=Array.from({length:52},(_,i)=>i).filter(c=>!known.includes(c)),missing=5-board.length;
 if(missing<0)return null;
 const total=active.map(()=>0);let count=0;
 const trial=extra=>{const full=[...board,...extra],scores=active.map(p=>root.Poker.evaluate([...p.hole,...full])),best=Math.max(...scores),winners=scores.map((n,i)=>n===best?i:-1).filter(i=>i>=0);for(const i of winners)total[i]+=1/winners.length;count++};
 if(!missing)trial([]);else if(missing===1)for(const c of remaining)trial([c]);else if(missing===2){for(let i=0;i<remaining.length;i++)for(let j=i+1;j<remaining.length;j++)trial([remaining[i],remaining[j]])}else for(let n=0;n<samples;n++){const deck=[...remaining];for(let i=0;i<missing;i++){const j=i+Math.floor(rng()*(deck.length-i));[deck[i],deck[j]]=[deck[j],deck[i]]}trial(deck.slice(0,missing))}
 const result=players.map(()=>null);active.forEach((p,i)=>result[p.index]=total[i]/count);return result;
}
const api={estimate};root.ShowdownEquity=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
