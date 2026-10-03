(()=>{'use strict';
const base=String(window.RIVER_ONLINE_ENDPOINT||'').replace(/\/$/,'');
function socketConnect({code,token,name,onMessage,onClose,onError}){
 const ws=new WebSocket(base.replace(/^http/,'ws')+'/api/rooms/'+code+'/ws');let heartbeat;
 ws.onopen=()=>{ws.send(JSON.stringify({type:'join',token,name}));heartbeat=setInterval(()=>{if(ws.readyState===WebSocket.OPEN)ws.send('ping')},25000)};
 ws.onmessage=e=>{if(e.data==='pong')return;try{onMessage(JSON.parse(e.data))}catch{}};
 ws.onerror=()=>onError(Error('暂时无法连接好友房，请检查网络。'));
 ws.onclose=()=>{clearInterval(heartbeat);onClose()};
 return {send(d){if(ws.readyState!==WebSocket.OPEN)throw Error('连接尚未恢复');ws.send(JSON.stringify(d))},close(){ws.onclose=null;clearInterval(heartbeat);ws.close()}};
}
window.RiverTransport={available:!!base,provider:'websocket',async create(data){const response=await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),r=await response.json();if(!response.ok)throw Error(r.error||'无法创建房间');return r},connect:socketConnect};
})();
