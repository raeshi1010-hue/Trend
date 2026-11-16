const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function displayTitle(value){
 const names={amp:'&',quot:'"',apos:"'",lt:'<',gt:'>',nbsp:' ',rsquo:'’',lsquo:'‘',rdquo:'”',ldquo:'“'};
 return String(value??'').replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp|rsquo|lsquo|rdquo|ldquo);/gi,(whole,k)=>{
  if(k[0]!=='#')return names[k.toLowerCase()]??whole;
  const n=k[1].toLowerCase()==='x'?parseInt(k.slice(2),16):Number(k.slice(1));return n>0&&n<=0x10ffff?String.fromCodePoint(n):whole;
 });
}
export function displayMetrics(metrics={}){
 const labels={replies:'回复',comments:'评论',views:'浏览',likes:'点赞',viewsDisplay:'浏览（取整）',repliesDisplay:'回复（取整）',score:'帖子净分',upvoteRatio:'赞同比例',viewCount:'播放',likeCount:'点赞',commentCount:'评论',like_count:'点赞',reply_count:'回复',retweet_count:'转帖',repost_count:'转帖',quote_count:'引用',impression_count:'曝光',bookmark_count:'收藏'};
 const values=Object.entries(metrics||{}).filter(([,v])=>v!=null).map(([key,value])=>(labels[key]||key)+' '+value);
 return values.length?values.join(' · '):'互动指标未取得';
}
export function presentDashboard(html,attempts){
 for(const item of attempts.flatMap(s=>s.items)){
  const raw='<p>'+escape(JSON.stringify(item.metrics))+' · '+escape(item.market)+'</p>';
  html=html.replaceAll(raw,()=>'<p>'+escape(displayMetrics(item.metrics))+' · '+escape(item.market)+'</p>');
  if(item.originResolution){
   const old='作者：'+(item.author||'待核验')+' · 首发：'+(item.publishedAt||'待核验')+' · 核验：'+(item.detail?.status||'待核验');
   const label='作者：'+(item.author||'待核验')+' · 首发：'+(item.publishedAt||'待核验')+' · 首发字段来源：'+item.originResolution.status;
   html=html.replaceAll(escape(old),()=>escape(label));
  }
  const oldTitle=escape(item.title),newTitle=escape(displayTitle(item.title));
  if(oldTitle&&oldTitle!==newTitle)html=html.replaceAll(oldTitle,()=>newTitle);
 }
 return html;
}
