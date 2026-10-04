(function(root){'use strict';
function cues(previous,r){const g=r.game;if(!g)return [];const p=previous?.code===r.code&&previous.game?.hand===g.hand?previous.game:null,out=[];
 if(!p){if(!g.done&&g.street===0&&g.players.every(x=>x.total<=r.blind))out.push({kind:'deal',count:Math.min(10,g.players.filter(x=>x.inHand).length*2)});}
 else {const spent=g.players.filter((x,i)=>x.total>(p.players[i]?.total||0));if(spent.length)out.push({kind:spent.some(x=>x.stack===0)?'allin':'bet',count:Math.min(5,spent.length+1)});if(g.players.some((x,i)=>x.folded&&!p.players[i]?.folded))out.push({kind:'fold'});if(g.board.length>p.board.length)out.push({kind:'reveal',count:g.board.length-p.board.length});if(g.done&&!p.done)out.push({kind:g.result.payouts[r.seat]-(g.players[r.seat]?.total||0)>0?'win':'settle'});}
 if(!g.done&&!g.runout&&g.turn===r.seat&&(!p||p.turn!==g.turn||p.street!==g.street))out.push({kind:'turn'});return out;
}
const api={cues};root.TableAudioCore=api;if(typeof module!=='undefined')module.exports=api;
if(!root.document)return;
const $=id=>document.getElementById(id);let prefs={effects:true,music:false,muted:false,style:'cinema',volume:.35};try{prefs={...prefs,...JSON.parse(localStorage.getItem('river-audio-v1')||'{}')}}catch{}prefs.volume=Math.max(0,Math.min(1,Number(prefs.volume)||0));if(!['cinema','jazz'].includes(prefs.style))prefs.style='cinema';
let context,master,effects,music,noiseBuffer,unlocked=false,recording=false,voicePlaying=false,timer=null,step=0,nextBeat=0,lastState=null,warnings=new Set(),youAct=false;
const midi=n=>440*2**((n-69)/12),save=()=>{try{localStorage.setItem('river-audio-v1',JSON.stringify(prefs))}catch{}};
function update(){
 if(master){master.gain.cancelScheduledValues(context.currentTime);master.gain.setValueAtTime(recording||prefs.muted?0:prefs.volume,context.currentTime);music.gain.setTargetAtTime(!prefs.music||voicePlaying?0:youAct?.075:.14,context.currentTime,.08);}
 const sound=$('tableSound'),bg=$('tableMusic'),mute=$('quickMute');if(sound){sound.textContent='牌桌音效：'+(prefs.effects?'开':'关');sound.setAttribute('aria-pressed',String(prefs.effects))}if(bg){bg.textContent='背景音乐：'+(prefs.music?'开':'关');bg.setAttribute('aria-pressed',String(prefs.music))}if(mute){mute.textContent=prefs.muted?'🔇':'🔊';mute.setAttribute('aria-label',prefs.muted?'恢复声音':'一键静音');mute.setAttribute('aria-pressed',String(prefs.muted))}
 if($('audioVolume'))$('audioVolume').value=Math.round(prefs.volume*100);if($('musicStyle'))$('musicStyle').value=prefs.style;
 if($('audioStatus'))$('audioStatus').textContent=recording?'录音中 · 牌桌声音已静音':prefs.muted?'已静音':prefs.volume===0?'音量为零':!unlocked?'进入牌桌或点击试听后启用声音':context?.state!=='running'?'声音已暂停，点击试听恢复':prefs.music?'原创配乐播放中 · '+(prefs.style==='cinema'?'港片登场':'深夜爵士'):prefs.effects?'发牌、开牌与下注音效已就绪':'牌桌音效已关闭';
}
function tone(freq,time,duration,level,type='triangle',bus=effects,cutoff=4000){
 if(!context)return;const osc=context.createOscillator(),filter=context.createBiquadFilter(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,time);filter.type='lowpass';filter.frequency.setValueAtTime(cutoff,time);gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(level,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(filter);filter.connect(gain);gain.connect(bus);osc.onended=()=>{osc.disconnect();filter.disconnect();gain.disconnect()};osc.start(time);osc.stop(time+duration+.02);
}
function noise(time,duration,level,frequency,bus=effects){
 const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();source.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=frequency;filter.Q.value=.7;gain.gain.setValueAtTime(level,time);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);source.connect(filter);filter.connect(gain);gain.connect(bus);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect()};source.start(time);source.stop(time+duration);
}
function effect(kind,count=1){
 if(!unlocked||context?.state!=='running'||document.hidden||recording||prefs.muted||!prefs.effects)return;
 const t=context.currentTime+.015;
 if(kind==='deal'||kind==='reveal'||kind==='fold'){for(let i=0;i<Math.min(count,10);i++){const at=t+i*(kind==='deal'?.065:.12);noise(at,.11,kind==='fold'?.12:.21,kind==='reveal'?2100:1400);tone(kind==='reveal'?185:120,at+.045,.06,.1,'triangle');}}
 else if(kind==='bet'||kind==='allin'){for(let i=0;i<(kind==='allin'?6:count);i++){const at=t+i*.045;tone(2350+i*137,at,.09,.075,'sine');tone(3900+i*91,at,.055,.04,'sine');noise(at,.04,.07,4000)}if(kind==='allin')tone(75,t+.03,.3,.16,'sine');}
 else if(kind==='turn'){tone(660,t,.12,.09,'sine');tone(880,t+.1,.16,.08,'sine')}
 else if(kind==='tick')tone(720,t,.055,.065,'sine');
 else {const notes=kind==='win'?[69,73,76,81]:[57,64,69];notes.forEach((n,i)=>tone(midi(n),t+i*.12,.45,.11,'triangle'));}
}
// Original minor-key lounge score; no film melody or copyrighted recording is sampled.
function musicTick(){
 if(!context||context.state!=='running')return;if(nextBeat<context.currentTime-.2)nextBeat=context.currentTime+.04;const bpm=prefs.style==='cinema'?104:82,unit=60/bpm/4;
 while(nextBeat<context.currentTime+.25){const bar=Math.floor(step/16)%8,k=step%16,t=nextBeat,rootNote=[45,45,50,50,53,52,45,52][bar];
  if(k%4===0){tone(midi(rootNote+[0,7,12,7][Math.floor(k/4)]),t,.24,.24,'triangle',music,700);tone(k%8===0?58:50,t,.11,.13,'sine',music,250)}
  if(k%4===2)noise(t,.035,.09,6500,music);if(k===4||k===12)noise(t,.12,.055,1800,music);
  if(k===2||k===10){[rootNote+12,rootNote+15,rootNote+19,rootNote+22].forEach(n=>tone(midi(n),t,.42,.043,'triangle',music,2100));}
  const motif=prefs.style==='cinema'?[null,null,69,null,72,76,null,74,null,72,69,null,67,null,64,null]:[null,64,null,67,null,71,null,null,69,null,67,null,64,null,null,null];const note=motif[(k+bar*2)%16];if(note!==null&&bar%2===0)tone(midi(note+(bar===4?5:0)),t,.21,prefs.style==='cinema'?.067:.055,prefs.style==='cinema'?'sawtooth':'sine',music,1450);
  step++;nextBeat+=unit;
 }
}
function stopMusic(){clearInterval(timer);timer=null;if(music&&context){music.gain.cancelScheduledValues(context.currentTime);music.gain.setTargetAtTime(0,context.currentTime,.05)}}
function startMusic(){if(timer||!unlocked||!prefs.music||prefs.muted||document.hidden||recording||context?.state!=='running')return;nextBeat=context.currentTime+.06;musicTick();timer=setInterval(musicTick,120)}
async function unlock(){
 try {if(!context){const C=root.AudioContext||root.webkitAudioContext;if(!C)throw Error('不支持音频');context=new C();master=context.createGain();effects=context.createGain();music=context.createGain();const limiter=context.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=5;effects.connect(master);music.connect(master);master.connect(limiter);limiter.connect(context.destination);noiseBuffer=context.createBuffer(1,Math.ceil(context.sampleRate*.3),context.sampleRate);const samples=noiseBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;context.onstatechange=update;}
  await context.resume();unlocked=context.state==='running';update();startMusic();
 }catch{if($('audioStatus'))$('audioStatus').textContent='当前浏览器未能启用声音，可换浏览器或再次点击试听。'}
}
function observe(r){const list=cues(lastState,r);const g=r.game;lastState={code:r.code,game:g?{hand:g.hand,street:g.street,turn:g.turn,done:g.done,board:g.board.slice(),players:g.players.map(p=>({total:p.total,folded:p.folded,stack:p.stack}))}:null};youAct=!!r.game&&!r.game.done&&!r.game.runout&&r.game.turn===r.seat;if(list.some(e=>e.kind==='deal'))warnings.clear();update();list.forEach(e=>effect(e.kind,e.count));}
function countdown(r,left){const g=r?.game;if(!g||g.done||g.runout||g.turn!==r.seat||left>3||left<=0)return;const key=[r.code,g.hand,g.street,g.players.map(p=>p.total).join(','),left].join(':');if(warnings.has(key))return;warnings.add(key);effect('tick');}
function record(active){recording=active;if(active)stopMusic();update();if(!active)startMusic();}
if($('tableSound'))$('tableSound').onclick=()=>{prefs.effects=!prefs.effects;save();return unlock().then(()=>{update();if(prefs.effects)effect('deal',3)})};
if($('tableMusic'))$('tableMusic').onclick=()=>{prefs.music=!prefs.music;save();if(!prefs.music)stopMusic();return unlock().then(update)};
if($('quickMute'))$('quickMute').onclick=()=>{prefs.muted=!prefs.muted;save();if(prefs.muted)stopMusic();return unlock().then(update)};
if($('musicStyle'))$('musicStyle').onchange=e=>{prefs.style=e.target.value;step=0;stopMusic();save();unlock()};
if($('audioVolume'))$('audioVolume').oninput=e=>{prefs.volume=Number(e.target.value)/100;save();update()};
if($('audioPreview'))$('audioPreview').onclick=()=>{prefs.effects=true;prefs.muted=false;save();unlock().then(()=>{effect('deal',3);setTimeout(()=>effect('reveal',3),450);setTimeout(()=>effect('bet',3),1000);setTimeout(()=>effect('win'),1400)})};
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopMusic();context?.suspend().catch(()=>{})}else if(unlocked)unlock()});
for(const kind of ['play','pause','ended'])document.addEventListener(kind,e=>{if(e.target.tagName!=='AUDIO')return;voicePlaying=[...document.querySelectorAll('audio')].some(a=>!a.paused&&!a.ended);update()},true);
root.addEventListener('beforeunload',()=>{stopMusic();context?.close().catch(()=>{})});root.RiverAudio={unlock,observe,countdown,record,preferences:()=>({...prefs})};update();
})(typeof window!=='undefined'?window:globalThis);
