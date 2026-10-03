const assert=require('node:assert/strict'),P=require('./poker');const c=(r,s=0)=>s*13+r-2;
assert.equal(P.name(P.evaluate([10,11,12,13,14].map(r=>c(r)))),'皇家同花顺');
assert(P.evaluate([14,2,3,4,5].map((r,i)=>c(r,i%4)))<P.evaluate([2,3,4,5,6].map((r,i)=>c(r,i%4))));
assert.equal(P.name(P.evaluate([c(14,0),c(14,1),c(14,2),c(13,0),c(13,1),c(13,2),c(2,3)])),'葫芦');
let s=P.table();P.begin(s);assert.equal(s.turn,0);P.act(s,0,'call');assert.equal(s.street,0);assert.equal(s.turn,1);P.act(s,1,'check');assert.equal(s.street,1);assert.equal(s.turn,1);assert.throws(()=>P.act(s,1,'raise',10));
for(let n=0;n<400;n++){s=P.table([n%2?25:2000,n%2?3975:2000]);P.begin(s);let count=0;while(!s.done){assert(++count<100);let l=P.legal(s),r=Math.random();P.act(s,s.turn,r<.08?'fold':r<.32&&l.raise?'raise':l.check?'check':'call',r<.15?l.max:Math.min(l.max,l.min));assert.equal(s.players.reduce((a,p)=>a+p.stack,0)+s.pot,4000)}assert.equal(s.players.reduce((a,p)=>a+p.stack,0),4000);assert.equal(new Set([...s.board,...s.burn,...s.players.flatMap(p=>p.hole)]).size,s.board.length+s.burn.length+4)}
s=P.table();P.begin(s);let v=P.view(s);assert(!('players'in v));assert(!('deck'in v));const t=Date.now();for(let i=0;i<10;i++)P.decide(v,700);console.log('PASS: evaluator, betting order, legal raises, 400 random hands, chip conservation, AI input. 700 samples avg '+(Date.now()-t)/10+'ms');
