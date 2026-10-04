// Public layout fixture. Synthetic data only; no connection to the room server.
(()=>{'use strict';
window.RIVER_ONLINE_ENDPOINT='https://layout-fixture.invalid';
const now=Date.now(),player=(name,net,autoRefills=0,bot=false)=>({name,net,autoRefills,autoTopups:autoRefills*2000,bot,online:!bot,ready:true,hands:12,wins:net>0?5:2,topups:0,adjustments:0,stack:2000+net+autoRefills*2000,pendingTopup:0});
const rooms=[{code:'DE0100000001',capacity:6,initialStack:2000,blind:20,created:now-5400000,activity:now,hand:12,stage:'转牌',playing:true,status:'playing',online:2,bots:1,occupied:3,players:[{...player('牌桌主人',1600),host:true,seat:0},{...player('朋友',-2000,1),seat:1},{...player('River AI',400,0,true),seat:2}]},{code:'DE0100000002',capacity:12,initialStack:2000,blind:20,created:now-7200000,activity:now-120000,hand:0,stage:'等待开局',status:'waiting',online:1,bots:0,occupied:1,players:[{...player('等朋友入局',0),hands:0,wins:0,seat:0,host:true}]},{code:'DE0100000003',capacity:6,initialStack:2000,blind:20,created:now-10800000,activity:now-3600000,hand:3,stage:'本手结算',status:'offline',online:0,bots:1,occupied:2,players:[{...player('离线牌友',-1000),online:false,seat:0,host:true},{...player('AI 1',1000,0,true),seat:1}]},{code:'DE0100000004',capacity:6,initialStack:2000,blind:20,created:now-14400000,activity:now-7200000,closedAt:now-7200000,hand:4,stage:'本手结算',status:'closed',online:0,bots:0,occupied:1,players:[{...player('已经散场',0),online:false,seat:0,host:true}]}];
let verified=false;
window.fetch=async(url,options={})=>{if(!String(url).startsWith(window.RIVER_ONLINE_ENDPOINT+'/api/admin/'))throw Error('布局验收不允许外部请求');let status=200,out={},route=String(url).split('/api/admin')[1],data=options.body?JSON.parse(options.body):{};
if(route==='/login'){verified=data.key==='preview';out=verified?{token:'fixture-only-session',expiresAt:now+28800000}:{error:'验收口令为 preview。'};if(!verified)status=401}
else if(!verified){status=401;out={error:'仅为布局验收，口令 preview。'}}
else if(route==='/logout'){verified=false;out={ok:true}}
else if(route==='/rooms'){out={rooms:structuredClone(rooms),serverTime:Date.now()}}
else{const parts=route.split('/'),r=rooms.find(r=>r.code===parts[2]);if(!r){status=404;out={error:'不存在的演示房间'}}else if(parts[3]){r.closedAt=parts[3]==='close'?Date.now():null;r.online=0;r.players.forEach(p=>p.online=false);r.status=r.closedAt?'closed':'offline';out={ok:true,room:structuredClone(r)}}else out={room:structuredClone(r)}}
return {ok:status>=200&&status<300,status,async json(){return out}};
};
})();
