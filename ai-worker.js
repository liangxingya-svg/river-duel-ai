importScripts('poker.js');onmessage=e=>{try{postMessage({id:e.data.id,decision:Poker.decide(e.data.view,700)})}catch(err){postMessage({id:e.data.id,error:err.message})}};
