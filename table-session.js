(function(root){'use strict';
const fresh=()=>({hands:0,wins:0,net:0,topups:0,adjustments:0,autoRefills:0,autoTopups:0});
function ensure(r){
 if(!r.stats){r.stats=r.seats.map(fresh);for(const h of r.handRecords||[])accumulate(r,h.game);r.statsLastHand=Math.max(0,...(r.handRecords||[]).map(h=>h.game.hand))}
 while(r.stats.length<r.seats.length)r.stats.push(fresh());
 for(const s of r.stats){s.autoRefills=s.autoRefills||0;s.autoTopups=s.autoTopups||0}
 return r.stats;
}
function accumulate(r,g){for(let i=0;i<g.players.length;i++){const p=g.players[i],s=r.stats[i];if(!p.inHand||!s)continue;const net=g.gameType==='doudizhu'?g.result.net[i]:(g.result.payouts[i]||0)-p.total;s.hands++;s.net+=net;if(g.gameType==='doudizhu'?g.result.winners.includes(i):net>0)s.wins++}}
function record(r){ensure(r);const g=r.game;if(g?.done&&g.result&&g.hand>(r.statsLastHand||0)){accumulate(r,g);r.statsLastHand=g.hand}}
function stack(r,i){return r.game?.players[i]?.stack??r.seats[i].balance??r.stack}
function credit(r,i,amount){if(r.game?.players[i])r.game.players[i].stack+=amount;else r.seats[i].balance=stack(r,i)+amount;r.stats[i].topups+=amount;r.seats[i].sittingOut=false;r.seats[i].timeouts=0}
function topup(r,i,amount){ensure(r);if(!Number.isSafeInteger(amount)||amount<r.blind||amount>5000||amount%r.blind!==0)throw Error('补入金额需为大盲整数倍，最多5,000。');if(stack(r,i)+amount>100000)throw Error('桌上筹码最多100,000。');r.pendingTopups=r.pendingTopups||{};if(r.pendingTopups[i])throw Error('已有待入账补筹码，请等待本手结束。');if(r.game&&!r.game.done)r.pendingTopups[i]=amount;else credit(r,i,amount)}
function apply(r){
 if(r.game&&!r.game.done)return;
 record(r);
 // Refill only settled busts. Preserve the hand archive, winnings and away status.
 if(r.game?.done&&r.game.result)for(let i=0;i<r.game.players.length;i++){
  const p=r.game.players[i];if(!p.inHand||p.stack!==0)continue;
  p.stack=r.stack;r.stats[i].autoRefills++;r.stats[i].autoTopups+=r.stack;
 }
 for(const [i,n]of Object.entries(r.pendingTopups||{}))credit(r,Number(i),n);
 r.pendingTopups={};
}
function reset(r){ensure(r);record(r);apply(r);for(let i=0;i<r.seats.length;i++){r.stats[i].adjustments+=r.stack-stack(r,i);r.seats[i].balance=r.stack}r.game=null}
function summary(r){record(r);return {autoRefillEnabled:true,initialStack:r.stack,hands:Math.max(0,...r.stats.map(s=>s.hands)),players:r.seats.map((p,i)=>({name:p.name,...r.stats[i],stack:stack(r,i),pendingTopup:r.pendingTopups?.[i]||0}))}}
const api={ensure,record,stack,topup,apply,reset,summary};root.TableSession=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
