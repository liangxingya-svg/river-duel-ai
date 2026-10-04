(function(root){'use strict';
// Shared, authoritative classic three-player rules. IDs 0..51 match the poker deck.
const labels={single:'单张',pair:'对子',triple:'三张',tripleSingle:'三带一',triplePair:'三带二',straight:'顺子',pairs:'连对',plane:'飞机',planeSingle:'飞机带单',planePair:'飞机带对',fourSingle:'四带二',fourPair:'四带两对',bomb:'炸弹',rocket:'王炸'};
const rank=c=>c===52?16:c===53?17:c%13===0?15:c%13+2;
const sort=cards=>cards.slice().sort((a,b)=>rank(b)-rank(a)||b-a);
const valid=cards=>Array.isArray(cards)&&cards.length>0&&cards.length<=20&&cards.every(c=>Number.isInteger(c)&&c>=0&&c<54)&&new Set(cards).size===cards.length;
function groups(cards){const g=new Map();for(const c of cards){const r=rank(c);if(!g.has(r))g.set(r,[]);g.get(r).push(c)}return g}
const consecutive=rs=>rs.length>0&&rs[rs.length-1]<=14&&rs.every((r,i)=>!i||r===rs[i-1]+1);
function classify(cards){
 if(!valid(cards))return [];
 const g=groups(cards),rs=[...g.keys()].sort((a,b)=>a-b),n=cards.length,out=[];
 const add=(type,main,units=1)=>out.push({type,main,units,length:n,label:labels[type]});
 if(n===2&&g.has(16)&&g.has(17))add('rocket',17);
 if(rs.length===1){if(n===1)add('single',rs[0]);if(n===2)add('pair',rs[0]);if(n===3)add('triple',rs[0]);if(n===4)add('bomb',rs[0])}
 const three=rs.filter(r=>g.get(r).length===3),four=rs.filter(r=>g.get(r).length===4);
 if(n===4&&three.length===1)add('tripleSingle',three[0]);
 if(n===5&&three.length===1&&rs.length===2&&rs.some(r=>g.get(r).length===2))add('triplePair',three[0]);
 if(n>=5&&rs.length===n&&consecutive(rs))add('straight',rs[n-1],n);
 if(n>=6&&n%2===0&&rs.length===n/2&&rs.every(r=>g.get(r).length===2)&&consecutive(rs))add('pairs',rs[rs.length-1],n/2);
 if(n>=6&&n%3===0&&rs.length===n/3&&rs.every(r=>g.get(r).length===3)&&consecutive(rs))add('plane',rs[rs.length-1],n/3);
 for(const [type,unit]of [['planeSingle',4],['planePair',5]]){
  const k=n/unit;if(!Number.isInteger(k)||k<2)continue;
  for(let start=3;start+k-1<=14;start++){
   const body=Array.from({length:k},(_,i)=>start+i);if(!body.every(r=>g.get(r)?.length===3))continue;
   const wings=rs.filter(r=>!body.includes(r)),counts=wings.map(r=>g.get(r).length);
   // Single wings may form pairs, but may not contain a bomb, both jokers, or a third triple.
   if(type==='planeSingle'&&counts.reduce((a,b)=>a+b,0)===k&&counts.every(c=>c<=2)&&!(wings.includes(16)&&wings.includes(17)))add(type,start+k-1,k);
   if(type==='planePair'&&wings.length===k&&counts.every(c=>c===2))add(type,start+k-1,k);
  }
 }
 if(n===6&&four.length===1){const wings=rs.filter(r=>r!==four[0]);if(!(wings.includes(16)&&wings.includes(17)))add('fourSingle',four[0])}
 if(n===8&&four.length===1&&rs.filter(r=>r!==four[0]).length===2&&rs.filter(r=>r!==four[0]).every(r=>g.get(r).length===2))add('fourPair',four[0]);
 return out;
}
function beats(a,b){if(!a)return false;if(!b)return true;if(b.type==='rocket')return false;if(a.type==='rocket')return true;if(a.type==='bomb'&&b.type!=='bomb')return true;return a.type===b.type&&a.length===b.length&&a.main>b.main}
function pick(cards,last){return classify(cards).find(a=>beats(a,last))||null}
function shuffle(rng){const deck=Array.from({length:54},(_,i)=>i);for(let i=53;i>0;i--){let j;if(rng){const n=rng();if(!(n>=0&&n<1))throw Error('随机源不合法');j=Math.floor(n*(i+1))}else{if(!root.crypto?.getRandomValues)throw Error('安全随机源不可用');const limit=Math.floor(4294967296/(i+1))*(i+1),a=new Uint32Array(1);do{root.crypto.getRandomValues(a)}while(a[0]>=limit);j=a[0]%(i+1)}[deck[i],deck[j]]=[deck[j],deck[i]]}return deck}
function create(stacks,names,base=20){if(stacks.length!==3||stacks.some(s=>!Number.isSafeInteger(s)||s<=0))throw Error('斗地主需要三位有筹码的牌手');return {gameType:'doudizhu',hand:0,base,players:stacks.map((stack,i)=>({name:names[i],stack,cards:[],inHand:true,plays:0,double:1,revealed:false})),done:true,events:[]}}
function begin(g,rng){g.hand++;g.attempt=0;g.first=(g.hand-1)%3;deal(g,rng)}
function deal(g,rng){const deck=shuffle(rng);g.attempt++;g.bottom=deck.slice(51);g.players.forEach((p,i)=>{p.cards=sort(deck.slice(i*17,(i+1)*17));p.plays=0;p.double=1;p.revealed=false;p.inHand=true});g.done=false;g.result=null;g.phase='dealing';g.runout=true;g.turn=g.first;g.landlord=-1;g.multiplier=1;g.revealMultiplier=false;g.lastPlay=null;g.passes=0;g.declined=[];g.robQueue=[];g.firstCaller=-1;g.robbed=false;g.lastMoves=[null,null,null];g.events=[];g.startStacks=g.players.map(p=>p.stack);g.log='正在洗牌发牌';}
function event(g,seat,kind,cards=[],pattern=null){const e={seq:g.events.length+1,seat,kind,cards:sort(cards),pattern:pattern?.label||null,multiplier:g.multiplier};g.events.push(e);if(seat>=0&&kind!=='win')g.lastMoves[seat]=e;return e}
function landlord(g){g.landlord=g.candidate;g.players[g.landlord].cards=sort([...g.players[g.landlord].cards,...g.bottom]);g.phase='double';g.turn=g.landlord;g.doubleLeft=3;g.log=g.players[g.landlord].name+'成为地主';event(g,g.landlord,'landlord')}
function advanceRunout(g,rng){if(!g.runout||g.done)throw Error('当前没有发牌动画');g.runout=false;if(g.phase==='redeal'){g.first=(g.first+1)%3;deal(g,rng)}else{g.phase='bid';g.log='请选择叫地主或不叫'}}
function settle(g,winner){
 const l=g.landlord,landlordWon=winner===l,spring=landlordWon?g.players.filter((_,i)=>i!==l).every(p=>p.plays===0):g.players[l].plays===1;
 if(spring)g.multiplier*=2;
 const farmers=[0,1,2].filter(i=>i!==l),stakes=farmers.map(i=>Math.min(g.players[i].stack,g.base*g.multiplier*g.players[l].double*g.players[i].double));
 const total=stakes[0]+stakes[1],cap=Math.min(g.players[l].stack,total);
 if(total>cap){const first=Math.floor(cap*stakes[0]/total);stakes[0]=first;stakes[1]=cap-first}
 const net=[0,0,0];farmers.forEach((i,j)=>{net[i]=(landlordWon?-1:1)*stakes[j];net[l]-=net[i]});g.players.forEach((p,i)=>p.stack+=net[i]);
 g.done=true;g.runout=false;g.phase='result';g.turn=-1;g.result={winner,landlordWon,winners:landlordWon?[l]:farmers,net,spring:spring?(landlordWon?'春天':'反春天'):null,multiplier:g.multiplier,base:g.base,capped:cap<g.base*g.multiplier*g.players[l].double*farmers.reduce((s,i)=>s+g.players[i].double,0),finalCards:g.players.map(p=>sort(p.cards)),winningPattern:g.lastPlay.pattern.label};g.log=(landlordWon?'地主':'农民')+'获胜';event(g,winner,'win');
}
function act(g,seat,kind,value){
 if(g.done||g.runout||seat!==g.turn)throw Error('还没轮到你行动');
 if(g.phase==='bid'){
  if(!['call','nocall'].includes(kind))throw Error('请选择叫地主或不叫');event(g,seat,kind);
  if(kind==='nocall'){g.declined.push(seat);if(g.declined.length===3){g.phase='redeal';g.runout=true;g.log='无人叫地主，重新发牌'}else g.turn=(seat+1)%3;return}
  g.firstCaller=seat;g.candidate=seat;g.robQueue=[(seat+1)%3,(seat+2)%3].filter(i=>!g.declined.includes(i));g.phase='rob';if(g.robQueue.length)g.turn=g.robQueue.shift();else landlord(g);return;
 }
 if(g.phase==='rob'){
  if(!['rob','norob'].includes(kind))throw Error('请选择抢地主或不抢');if(kind==='rob'){g.candidate=seat;g.multiplier*=2;g.robbed=true}event(g,seat,kind);
  if(g.robQueue.length)g.turn=g.robQueue.shift();else if(g.robbed&&seat!==g.firstCaller){g.turn=g.firstCaller;g.robbed=false}else landlord(g);return;
 }
 if(g.phase==='double'){
  if(!['double','nodouble','doubleReveal'].includes(kind))throw Error('请选择加倍或不加倍');g.players[seat].double=kind==='nodouble'?1:2;if(kind==='doubleReveal'){g.players[seat].revealed=true;if(!g.revealMultiplier){g.multiplier*=2;g.revealMultiplier=true}}event(g,seat,kind);g.doubleLeft--;if(g.doubleLeft){g.turn=(seat+1)%3}else{g.phase='play';g.turn=g.landlord;g.lastMoves=[null,null,null];g.log='地主先出牌'}return;
 }
 if(g.phase!=='play')throw Error('当前不能出牌');
 if(kind==='pass'){
  if(!g.lastPlay||g.lastPlay.seat===seat)throw Error('领出时不能不出');event(g,seat,'pass');g.passes++;g.turn=(seat+1)%3;if(g.passes===2){g.turn=g.lastPlay.seat;g.lastPlay=null;g.passes=0;g.lastMoves=[null,null,null];g.log='其他两家不出，重新领出'}return;
 }
 if(kind!=='play'||!valid(value))throw Error('请选择要出的牌');const p=g.players[seat];if(!value.every(c=>p.cards.includes(c)))throw Error('只能出自己的手牌');const pattern=pick(value,g.lastPlay?.pattern);if(!pattern)throw Error(g.lastPlay?'牌型或张数不一致，或没有大过上一手':'所选牌不是合法牌型');p.cards=p.cards.filter(c=>!value.includes(c));p.plays++;if(pattern.type==='bomb'||pattern.type==='rocket')g.multiplier*=2;g.lastPlay={seat,cards:sort(value),pattern};g.passes=0;event(g,seat,'play',value,pattern);g.log=pattern.label;if(!p.cards.length){settle(g,seat);return}g.turn=(seat+1)%3;
}
function view(g,seat){return {gameType:'doudizhu',hand:g.hand,attempt:g.attempt,phase:g.phase,runout:g.runout,turn:g.turn,landlord:g.landlord,firstCaller:g.firstCaller,base:g.base,multiplier:g.multiplier,done:g.done,log:g.log,bottom:g.landlord<0&&!g.done?[]:g.bottom.slice(),lastPlay:g.lastPlay?structuredClone(g.lastPlay):null,lastMoves:structuredClone(g.lastMoves),events:structuredClone(g.events),result:g.result?structuredClone(g.result):null,players:g.players.map((p,i)=>({name:p.name,stack:p.stack,inHand:true,count:p.cards.length,plays:p.plays,double:p.double,revealed:p.revealed,cards:i===seat||p.revealed||g.done?p.cards.slice():[]}))}}
// Generate combinations by rank structure rather than enumerating 2^20 arbitrary subsets.
function moves(cards,last=null){
 const g=groups(sort(cards)),rs=[...g.keys()].sort((a,b)=>a-b),out=[],seen=new Set();
 const add=cs=>{const key=cs.slice().sort((a,b)=>a-b).join(',');if(seen.has(key))return;seen.add(key);const p=pick(cs,last);if(p)out.push({kind:'play',cards:sort(cs),pattern:p})};
 const choose=(items,k,fn,start=0,chosen=[])=>{if(!k){fn(chosen);return}for(let i=start;i<=items.length-k;i++)choose(items,k-1,fn,i+1,[...chosen,items[i]])};
 for(const r of rs){const a=g.get(r);for(let n=1;n<=a.length;n++)add(a.slice(0,n));if(a.length>=3){for(const w of rs.filter(x=>x!==r)){add([...a.slice(0,3),g.get(w)[0]]);if(g.get(w).length>=2)add([...a.slice(0,3),...g.get(w).slice(0,2)])}}}
 if(g.has(16)&&g.has(17))add([52,53]);
 for(const [n,min]of [[1,5],[2,3],[3,2]])for(let start=3;start<=14;start++)for(let end=start;end<=14;end++){
  const body=Array.from({length:end-start+1},(_,i)=>start+i);if(!body.every(r=>(g.get(r)?.length||0)>=n))break;if(body.length<min)continue;const cs=body.flatMap(r=>g.get(r).slice(0,n));add(cs);
  if(n===3){const wingRanks=rs.filter(r=>!body.includes(r));const singles=wingRanks.flatMap(r=>g.get(r).slice(0,2));choose(singles,body.length,w=>add([...cs,...w]));const pairs=wingRanks.filter(r=>g.get(r).length>=2);choose(pairs,body.length,w=>add([...cs,...w.flatMap(r=>g.get(r).slice(0,2))]))}
 }
 for(const r of rs.filter(r=>g.get(r).length===4)){const wings=rs.filter(x=>x!==r),singles=wings.flatMap(x=>g.get(x).slice(0,2));choose(singles,2,w=>add([...g.get(r),...w]));choose(wings.filter(x=>g.get(x).length>=2),2,w=>add([...g.get(r),...w.flatMap(x=>g.get(x).slice(0,2))]))}
 return out;
}
function strength(cards){const g=groups(cards);return cards.reduce((s,c)=>s+(rank(c)>=15?1:0),0)+[...g.values()].filter(a=>a.length===4).length*3+(g.has(16)&&g.has(17)?3:0)}
function ai(g,seat){
 const v=view(g,seat),cards=v.players[seat].cards; // Decisions see only this player's hand and public actions.
 if(v.phase==='bid')return {kind:strength(cards)>=5?'call':'nocall'};
 if(v.phase==='rob')return {kind:strength(cards)>=7?'rob':'norob'};
 if(v.phase==='double')return {kind:strength(cards)>=7?'double':'nodouble'};
 const options=moves(cards,v.lastPlay?.pattern);if(!options.length)return {kind:'pass'};
 const finish=options.find(m=>m.cards.length===cards.length);if(finish)return finish;
 if(v.lastPlay&&seat!==v.landlord&&v.lastPlay.seat!==v.landlord)return {kind:'pass'};
 const danger=v.players.some((p,i)=>i!==seat&&(seat===v.landlord||i===v.landlord)&&p.count<=2);
 const score=m=>{const remainder=cards.filter(c=>!m.cards.includes(c)),before=groups(cards),after=groups(remainder);let waste=0;for(const [r,a]of before){const b=after.get(r)?.length||0;if(a.length===4&&b>0&&b<4)waste+=8;if(a.length===3&&b>0&&b<3)waste+=3;if(a.length===2&&b===1)waste+=1}return m.cards.length*(v.lastPlay?0.7:2.5)-m.pattern.main*0.12-(m.pattern.type==='bomb'||m.pattern.type==='rocket'?danger?0:6:0)-waste};
 options.sort((a,b)=>score(b)-score(a)||a.pattern.main-b.pattern.main);if(v.lastPlay&&!danger&&options[0].pattern.type==='rocket'&&cards.length>5)return {kind:'pass'};return options[0];
}
function timeout(g,seat){if(g.phase==='bid')return {kind:'nocall'};if(g.phase==='rob')return {kind:'norob'};if(g.phase==='double')return {kind:'nodouble'};if(g.lastPlay)return {kind:'pass'};return {kind:'play',cards:[sort(g.players[seat].cards).at(-1)]}}
const legal=(g,seat)=>({pass:g.phase==='play'&&g.turn===seat&&!!g.lastPlay,check:false});
const api={rank,sort,labels,classify,beats,pick,shuffle,create,begin,advanceRunout,act,view,moves,ai,timeout,legal};root.Doudizhu=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
