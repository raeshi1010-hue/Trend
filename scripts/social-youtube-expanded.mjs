import {jsonRequest} from './social-adapters.mjs';
export const discoveryScopes=[
 {region:'欧洲',q:'formwork scaffolding construction UK Germany France'},
 {region:'欧洲',q:'Baustelle Schalung Gerüst chantier coffrage échafaudage'},
 {region:'北美',q:'formwork scaffolding concrete construction USA Canada'},
 {region:'北美',q:'building materials installation contractor USA Canada'},
 {region:'中东',q:'formwork scaffolding construction Saudi Arabia UAE'},
 {region:'中东',q:'مواد بناء مقاولات سقالات السعودية الإمارات'}
];
export async function youtubeExpanded(env=process.env,request=fetch,{now=Date.now()}={}){
 if(!env.YOUTUBE_API_KEY)return {status:'未配置 YOUTUBE_API_KEY',items:[],queries:[]};
 const after=new Date(now-7*86400000).toISOString(),queries=[],buckets=[],details=new Map();
 let stop=false;
 for(const scope of discoveryScopes){
  if(stop)break;
  const ids=[],tokens=new Set();let token='',pages=0,error=null;
  try{
   do{
    const params=new URLSearchParams({part:'snippet',type:'video',maxResults:'20',q:scope.q,order:'date',publishedAfter:after,key:env.YOUTUBE_API_KEY});
    if(token)params.set('pageToken',token);
    const data=await jsonRequest('https://www.googleapis.com/youtube/v3/search?'+params,{},request);pages++;
    for(const x of data.items||[]){const id=x.id?.videoId;if(/^[\w-]{11}$/.test(id)&&!ids.includes(id))ids.push(id);}
    token=data.nextPageToken||'';
    if(!token||tokens.has(token))break;tokens.add(token);
   }while(pages<2);
  }catch(e){error=/^HTTP_\d+$/.test(e.message)?e.message:e.name;if(error==='HTTP_403'||error==='HTTP_429')stop=true;}
  queries.push({...scope,pages,found:ids.length,error});buckets.push({scope,ids});
 }
 const unique=[...new Set(buckets.flatMap(b=>b.ids))];let detailError=null;
 for(let i=0;i<unique.length;i+=50){
  try{const d=await jsonRequest('https://www.googleapis.com/youtube/v3/videos?'+new URLSearchParams({part:'snippet,statistics',id:unique.slice(i,i+50).join(','),key:env.YOUTUBE_API_KEY}),{},request);for(const v of d.items||[])details.set(v.id,v);}
  catch(e){detailError=/^HTTP_\d+$/.test(e.message)?e.message:e.name;break;}
 }
 const observedAt=new Date().toISOString(),items=[],seen=new Set();
 // Round robin prevents the first geographic query from consuming every display slot.
 for(let pos=0;pos<40;pos++)for(const b of buckets){
  const id=b.ids[pos],v=details.get(id);if(!v||seen.has(id))continue;seen.add(id);
  const published=Date.parse(v.snippet?.publishedAt);if(!Number.isFinite(published)||published<now-7*86400000||published>now)continue;
  const metrics=Object.fromEntries(Object.entries(v.statistics||{}).filter(([k,n])=>['viewCount','likeCount','commentCount'].includes(k)&&Number.isFinite(Number(n))&&Number(n)>=0).map(([k,n])=>[k,Number(n)]));
  items.push({title:v.snippet.title,url:'https://www.youtube.com/watch?v='+id,author:v.snippet.channelTitle,publishedAt:new Date(published).toISOString(),metrics,metricsObservedAt:observedAt,market:'市场未确认',tags:v.snippet.tags||[],bgm:null,sourceKind:'keyword_sample',discoveryRegion:b.scope.region,discoveryQuery:b.scope.q,detail:{status:'官方视频元数据；检索目标不证明项目或受众市场'}});
 }
 return {status:'官方API分市场关键词样本：'+queries.filter(q=>!q.error).length+'/'+discoveryScopes.length+'组；'+items.length+'条去重近期候选；非地区热榜'+(detailError?'；详情部分失败':''),
 items,queries,detailError,coverage:'欧洲／北美／中东各2组检索，每组最多2页×20；最多240候选；检索目标不等于受众市场',limits:{queries:6,pagesPerQuery:2,perPage:20},automatic:true};
}
