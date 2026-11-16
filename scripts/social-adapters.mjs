export async function jsonRequest(url, options={}, request=fetch) {
 const r=await request(url,{...options,signal:AbortSignal.timeout(20000),redirect:'error'});
 if(!r.ok)throw new Error('HTTP_'+r.status); // Never include credential-bearing URLs or bodies in errors.
 return r.json();
}
const text=s=>String(s??'').replace(/<[^>]*>/g,'').trim();
const iso=s=>s&&Number.isFinite(Date.parse(s))?new Date(s).toISOString():null;
export function parseForumListing(html){
 const rows=new Map();
 for(const block of html.split(/<div\b[^>]*class=["'][^"']*structItem--thread[^"']*["'][^>]*>/i).slice(1)){
  const id=block.match(/href=["'][^"']*\/threads\/[^"']*\.(\d+)\/?["']/i)?.[1];if(!id)continue;
  const metrics={};
  for(const [label,key] of [['Replies','replies'],['Views','views']]){
   const raw=text(block.match(new RegExp('<dt[^>]*>\\s*'+label+'\\s*</dt>\\s*<dd[^>]*>([\\s\\S]*?)</dd>','i'))?.[1]);
   // K/M abbreviations are rounded, so preserve text rather than invent an exact count.
   if(/^\d[\d,]*$/.test(raw))metrics[key]=Number(raw.replaceAll(',',''));
   else if(raw)metrics[key+'Display']=raw;
  }
  rows.set(id,metrics);
 }
 return rows;
}
export function parseForum(html) {
 const nodes=[];
 function walk(x){if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object'){nodes.push(x);if(x['@graph'])walk(x['@graph']);}}
 for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{walk(JSON.parse(m[1]));}catch{}}
 const node=nodes.find(x=>[x['@type']].flat().some(t=>['DiscussionForumPosting','SocialMediaPosting'].includes(t)));
 const article=html.match(/<article\b[^>]*\bdata-author=["']([^"']+)["'][^>]*>([\s\S]*?)<\/article>/i);
 const author=typeof node?.author==='string'?node.author:node?.author?.name||node?.author?.[0]?.name||article?.[1]||null;
 const publishedAt=iso(node?.datePublished)||iso(article?.[2].match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1]);
 const metrics={};
 if(Number.isFinite(Number(node?.commentCount))&&node?.commentCount!=null)metrics.comments=Number(node.commentCount);
 for(const stat of [node?.interactionStatistic].flat().filter(Boolean)){
  const kind=typeof stat.interactionType==='string'?stat.interactionType:stat.interactionType?.['@type'];
  const value=Number(stat.userInteractionCount);if(!Number.isFinite(value)||value<0)continue;
  if(/CommentAction$/.test(kind))metrics.comments=value;
  if(/ViewAction$/.test(kind))metrics.views=value;
  if(/LikeAction$/.test(kind))metrics.likes=value;
 }
 return {author:author?text(author):null,publishedAt,metrics,metadataSource:node?'DiscussionForumPosting JSON-LD':article?'首帖 article data-author/time':'未找到首帖元数据'};
}
export async function enrichForum(item,request=fetch){
 const u=new URL(item.url);
 if(u.hostname!=='www.diynot.com'||!u.pathname.startsWith('/diy/threads/'))return item;
 const observedAt=new Date().toISOString();
 try{
  const r=await request(u,{signal:AbortSignal.timeout(15000),redirect:'error'});
  if(!r.ok)throw new Error('HTTP_'+r.status);
  const parsed=parseForum(await r.text());
  const metrics={...item.metrics,...parsed.metrics};
  return {...item,rssDate:item.publishedAt,publishedAt:parsed.publishedAt,author:parsed.author,metrics,metricsObservedAt:observedAt,detail:{status:parsed.author&&parsed.publishedAt?'首帖作者与时间已提取':'首帖字段不完整',observedAt,metadataSource:parsed.metadataSource},verification:{author:!!parsed.author,publishedAt:!!parsed.publishedAt,metrics:Object.keys(metrics).length>0,market:false}};
 }catch(e){return {...item,rssDate:item.publishedAt,publishedAt:null,author:null,detail:{status:'单帖读取失败',error:/^HTTP_\d+$/.test(e.message)?e.message:e.name,observedAt}};}
}
export async function youtube(env=process.env,request=fetch){
 if(!env.YOUTUBE_API_KEY)return {status:'未配置 YOUTUBE_API_KEY',items:[]};
 try{
  const params=new URLSearchParams({part:'snippet',type:'video',maxResults:'10',q:'construction materials Saudi Arabia',order:'date',publishedAfter:new Date(Date.now()-7*86400000).toISOString(),key:env.YOUTUBE_API_KEY});
  const found=await jsonRequest('https://www.googleapis.com/youtube/v3/search?'+params,{},request);
  const ids=(found.items||[]).map(x=>x.id?.videoId).filter(x=>/^[\w-]{11}$/.test(x));
  if(!ids.length)return {status:'官方搜索返回0条',items:[]};
  const detail=await jsonRequest('https://www.googleapis.com/youtube/v3/videos?'+new URLSearchParams({part:'snippet,statistics',id:ids.join(','),key:env.YOUTUBE_API_KEY}),{},request);
  const observedAt=new Date().toISOString();
  return {status:'官方API读取成功（关键词样本，非地区热榜）',items:(detail.items||[]).map(v=>({title:v.snippet.title,url:'https://www.youtube.com/watch?v='+v.id,author:v.snippet.channelTitle,publishedAt:iso(v.snippet.publishedAt),metrics:Object.fromEntries(Object.entries(v.statistics||{}).filter(([k])=>['viewCount','likeCount','commentCount'].includes(k)).map(([k,n])=>[k,Number(n)])),metricsObservedAt:observedAt,market:'市场未确认',tags:v.snippet.tags||[],bgm:null,detail:{status:'官方视频元数据，BGM未提供'},sourceKind:'keyword_sample'}))};
 }catch(e){return {status:'YouTube接口失败',error:/^HTTP_\d+$/.test(e.message)?e.message:e.name,items:[]};}
}
export async function reddit(env=process.env,request=fetch){
 if(env.REDDIT_API_APPROVED!=='true')return {status:'待确认Reddit已批准本用途的API访问',items:[]};
 if(!env.REDDIT_ACCESS_TOKEN||!env.REDDIT_USER_AGENT)return {status:'缺少REDDIT_ACCESS_TOKEN或REDDIT_USER_AGENT',items:[]};
 try{
  const data=await jsonRequest('https://oauth.reddit.com/r/Construction/new?limit=10&raw_json=1',{headers:{Authorization:'Bearer '+env.REDDIT_ACCESS_TOKEN,'User-Agent':env.REDDIT_USER_AGENT}},request);
  const observedAt=new Date().toISOString();
  return {status:'官方OAuth读取成功（社区样本）',items:(data.data?.children||[]).map(({data:d})=>({title:d.title,url:'https://www.reddit.com'+d.permalink,author:d.author==='[deleted]'?null:d.author,publishedAt:iso(d.created_utc*1000),metrics:{score:d.score,comments:d.num_comments,upvoteRatio:d.upvote_ratio},metricsObservedAt:observedAt,market:'市场未确认',tags:[],bgm:null,sourceKind:'community_sample'}))};
 }catch(e){return {status:'Reddit接口失败（401需更新令牌；403需确认权限）',error:/^HTTP_\d+$/.test(e.message)?e.message:e.name,items:[]};}
}
