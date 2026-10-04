(function(root){'use strict';
const names=['今晚不加班','底池保卫战','一对也是梦想','河牌来救我','全押靠气势','发哥的下午茶','牌好人低调','摸鱼锦标赛','筹码搬运中心','别催在算赔率','转牌有惊喜','这把真有牌','小丑竟是河牌','老板先过牌','我有一张梦想','好运正在洗牌','菜鸟逆袭局','最后一把研究所','今天不当气氛组','深夜梭哈俱乐部','别看我看底池','运气也是技术','顺子还差一张','低调收下底池','表情管理大师','人菜瘾还大','朋友局没剧本','先喝茶再发牌','下班直接上桌','河神眷顾之地','今天轮到我','快乐筹码工厂'];
function title(code){let h=2166136261;for(const c of String(code||'river').toUpperCase())h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return names[h%names.length]+' · '+['茶水间','夜场','一号桌','快乐局','小分队','会客厅','好运桌','限定局'][(h>>>8)%8]}
const api={title};root.RoomNames=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
