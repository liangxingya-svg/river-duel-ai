const assert=require('node:assert/strict'),P=require('./poker');const c=(r,s=0)=>s*13+r-2;
assert.equal(P.name(P.evaluate([10,11,12,13,14].map(r=>c(r)))),'皇家同花顺');
assert(P.evaluate([14,2,3,4,5].map((r,i)=>c(r,i%4)))<P.evaluate([2,3,4,5,6].map((r,i)=>c(r,i%4))));
assert.equal(P.name(P.evaluate([c(14,0),c(14,1),c(14,2),c(13,0),c(13,1),c(13,2),c(2,3)])),'葫芦');
let s=P.table();P.begin(s);assert.equal(s.turn,0);P.act(s,0,'call');assert.equal(s.street,0);assert.equal(s.turn,1);P.act(s,1,'check');assert.equal(s.street,1);assert.equal(s.turn,1);assert.throws(()=>P.act(s,1,'raise',10));
for(let n=0;n<400;n++){s=P.table([n%2?25:2000,n%2?3975:2000]);P.begin(s);let count=0;while(!s.done){assert(++count<100);let l=P.legal(s),r=Math.random();P.act(s,s.turn,r<.08?'fold':r<.32&&l.raise?'raise':l.check?'check':'call',r<.15?l.max:Math.min(l.max,l.min));assert.equal(s.players.reduce((a,p)=>a+p.stack,0)+s.pot,4000)}assert.equal(s.players.reduce((a,p)=>a+p.stack,0),4000);assert.equal(new Set([...s.board,...s.burn,...s.players.flatMap(p=>p.hole)]).size,s.board.length+s.burn.length+4)}
s=P.table();P.begin(s);let v=P.view(s);assert(!('players'in v));assert(!('deck'in v));const t=Date.now();for(let i=0;i<10;i++)P.decide(v,700);console.log('PASS: evaluator, betting order, legal raises, 400 random hands, chip conservation, AI input. 700 samples avg '+(Date.now()-t)/10+'ms');
// Unequal all-in contributions return the unmatched amount.
s=P.table([100,3900]);P.begin(s);P.act(s,0,'raise',100);P.act(s,1,'call');assert(s.done);assert.equal(s.result.pot,200);assert.equal(s.players.reduce((a,p)=>a+p.stack,0),4000);
// A royal flush on the board ties regardless of hole cards.
s=P.table();P.begin(s);s.players[0].hole=[c(2,1),c(3,1)];s.players[1].hole=[c(4,2),c(5,2)];s.board=[10,11,12,13,14].map(r=>c(r));s.street=3;s.currentBet=0;s.turn=0;for(const p of s.players){p.bet=0;p.acted=false}P.act(s,0,'check');P.act(s,1,'check');assert.equal(s.result.winner,-1);assert.equal(s.players[0].stack,2000);assert.equal(s.players[1].stack,2000);console.log('PASS: unequal all-in pot and board tie');
s=P.table();P.begin(s);P.act(s,0,'raise',2000);P.act(s,1,'fold');assert.equal(s.result.pot,40);assert.equal(s.players[0].stack,2020);assert.equal(s.players[0].total,20);console.log('PASS: fold refunds unmatched all-in bet');
