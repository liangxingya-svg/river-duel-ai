(()=>{'use strict';
const $=id=>document.getElementById(id);let blocked=false;
function prepare(code){
 document.body.classList.add('invite-page');
 $('createOptions').hidden=true;$('createTimingOptions').hidden=true;$('joinCodeBox').hidden=true;
 for(const id of ['capacity','startingStack','blinds','decisionSeconds','autoNext'])$(id).disabled=true;
 $('lobbyTitle').textContent='朋友已开桌，等你入局。';$('enterRoom').textContent='进入好友房';
 $('roomHeading').textContent=window.RoomNames?.title(code)||'好友牌桌';
 $('inviteInfo').hidden=false;$('inviteCode').textContent='房间 '+code;
 $('inviteStatus').textContent='正在读取房间信息…';$('inviteDetails').hidden=true;
 $('inviteRetry').onclick=()=>load(code,window.RiverTransport);
}
function show(r){
 const compact=window.RiverMoney?.compact||String;
 $('inviteGame').textContent=r.gameType==='doudizhu'?'标准三人斗地主':'无限注德州扑克';
 $('invitePlayers').textContent=r.occupied+' / '+r.capacity+' 人';
 $('inviteStack').textContent=compact(r.stack)+' 筹码';$('inviteStack').title=String(r.stack);
 $('inviteBlindLabel').textContent=r.gameType==='doudizhu'?'底分':'小盲 / 大盲';
 $('inviteBlinds').textContent=r.gameType==='doudizhu'?'底分 '+compact(r.blind):compact(r.blind/2)+' / '+compact(r.blind);
 $('inviteDecision').textContent=r.decisionSeconds+' 秒 / 次';
 $('inviteStatus').textContent=r.occupied>=r.capacity?'座位已满；已有座位可用原浏览器返回。':r.status==='playing'?'本手进行中，请在本手结束后入桌。':'等待朋友入桌 · 准备后开局';
 $('inviteDetails').hidden=false;$('inviteRetry').hidden=true;
}
async function load(code,transport){
 $('inviteRetry').disabled=true;
 try{if(!transport?.describe)throw Error('暂时无法读取房间信息。');show(await transport.describe(code));if(blocked){$('enterRoom').disabled=false;blocked=false}}
 catch(e){$('inviteDetails').hidden=true;$('inviteStatus').textContent=e.status===404||e.status===410?e.message:'暂时无法读取房间信息，你仍可尝试入桌。';$('inviteRetry').hidden=false;if(e.status===404||e.status===410){$('enterRoom').disabled=true;blocked=true}}
 finally{$('inviteRetry').disabled=false}
}
window.RoomInvite={prepare,show,load};
})();
