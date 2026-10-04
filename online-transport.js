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
async function describe(code){
 if(!/^[A-F0-9]{12}$/.test(code))throw Error('邀请链接中的房间号无效。');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
 try{const response=await fetch(base+'/api/rooms/'+code+'/info',{signal:controller.signal}),r=await response.json();if(!response.ok){const e=Error(r.error||'暂时无法读取房间信息。');e.status=response.status;throw e}return r}finally{clearTimeout(timer)}
}
window.RiverTransport={available:!!base,provider:'websocket',describe,async create(data){const response=await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),r=await response.json();if(!response.ok)throw Error(r.error||'无法创建房间');return r},connect:socketConnect};
})();
