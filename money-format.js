(function(root){'use strict';
function value(n){n=Number(n);return Number.isFinite(n)?n:0}
function compact(n){n=value(n);const a=Math.abs(n);return a>=999950?(n/1000000).toFixed(1)+'M':a>=1000?(n/1000).toFixed(1)+'K':String(n)}
function exact(n){return value(n).toLocaleString('zh-CN')}
const api={compact,exact};root.RiverMoney=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
