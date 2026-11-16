export function assessItem(item,now=Date.now()){
 const gaps=[];const when=Date.parse(item.publishedAt);
 if(!item.author)gaps.push('作者未取得');
 if(!Number.isFinite(when))gaps.push('首发时间未取得');
 else if(when>now+300000||when<now-7*86400000)gaps.push('不在最近7天首发窗口');
 if(!Object.values(item.metrics||{}).some(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0))gaps.push('缺少精确帖子级互动指标');
 try{if(new URL(item.url).protocol!=='https:')gaps.push('原帖链接无效')}catch{gaps.push('原帖链接无效')}
 return {status:gaps.length?'待核验线索':'基础字段齐备',gaps,note:'字段完整度不等于地区或热度已核验'};
}
export function metricStructure(html,url){
 const id=new URL(url).pathname.match(/\.(\d+)\/?$/)?.[1];
 const needle=id&&new RegExp('href=["\'][^"\']*threads/[^"\']*\\.'+id+'(?:/|["\'])','i');
 const match=needle&&needle.exec(html);const index=match?.index;
 return {threadId:id,targetMatched:index!=null,threadRowCount:(html.match(/structItem--thread/g)||[]).length,template:html.match(/data-template=["']([^"']+)/i)?.[1]||null,preview:index!=null?html.slice(Math.max(0,index-1000),index+4000):null};
}
