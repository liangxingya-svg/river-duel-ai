const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function el(){return {value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},setAttribute(){},querySelector(){return el()},querySelectorAll(){return []},focus(){},scrollIntoView(){}}}
const ids=[...fs.readFileSync('online.html','utf8').matchAll(/id="([^"]+)"/g)].map(m=>m[1]),els=Object.fromEntries(ids.map(id=>[id,el()]));els.journalOutcome.value='all';
let createCount=0,descriptionCount=0,connection=null;
const data={code:'123456ABCDEF',gameType:'holdem',capacity:10,occupied:4,stack:5000,blind:100,decisionSeconds:30,autoNext:false,status:'waiting'};
const ctx={console,URL,URLSearchParams,Math,Date,Number,String,Array,Set,JSON,Promise,Error,localStorage:{getItem(){return null},setItem(){}},location:{search:'?room=123456abcdef',href:'https://example.test/online.html?room=123456abcdef'},history:{replaceState(){}},navigator:{},document:{getElementById:id=>{assert(els[id],id);return els[id]},querySelectorAll(){return []},body:{classList:el().classList},addEventListener(){}},setTimeout(){return 1},clearTimeout(){},setInterval(){},addEventListener(){}};ctx.window=ctx;
ctx.RiverTransport={available:true,provider:'websocket',async describe(code){descriptionCount++;assert.equal(code,data.code);return data},async create(){createCount++},connect(args){connection=args;return {send(){},close(){}}}};
vm.createContext(ctx);for(const f of ['money-format.js','room-names.js','room-invite.js','online.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
(async()=>{
 await new Promise(setImmediate);assert.equal(descriptionCount,1);assert.equal(els.createOptions.hidden,true);assert.equal(els.createTimingOptions.hidden,true);assert.equal(els.joinCodeBox.hidden,true);
 for(const id of ['capacity','startingStack','blinds','decisionSeconds','autoNext'])assert.equal(els[id].disabled,true);
 assert.equal(els.inviteStack.textContent,'5.0K 筹码');assert.equal(els.inviteBlinds.textContent,'50 / 100');assert.equal(els.inviteDecision.textContent,'30 秒 / 次');assert.equal(els.invitePlayers.textContent,'4 / 10 人');
 els.nickname.value='新朋友';await els.roomForm.onsubmit({preventDefault(){}});assert.equal(createCount,0);assert.equal(connection.name,'新朋友');assert.equal(connection.code,data.code);
 ctx.RoomInvite.show({...data,status:'playing'});assert(els.inviteStatus.textContent.includes('本手进行中'));
 await ctx.RoomInvite.load(data.code,{async describe(){const e=Error('房间已解散');e.status=410;throw e}});assert.equal(els.enterRoom.disabled,true);assert.equal(els.inviteDetails.hidden,true);assert.equal(els.inviteStatus.textContent,'房间已解散');
 await ctx.RoomInvite.load(data.code,{async describe(){throw Error('network failure')}});assert(els.inviteStatus.textContent.includes('仍可尝试入桌'));assert.equal(els.inviteRetry.hidden,false);
 console.log('PASS: host metadata and nickname-only invitation join; no creation settings submitted; playing/closed/network states');
})().catch(e=>{console.error(e);process.exitCode=1});
