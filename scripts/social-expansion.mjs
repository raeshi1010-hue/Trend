import {jsonRequest,parseForum} from './social-adapters.mjs';
import {publicText} from './social-public-http.mjs';
import {threadStatistics,forumCategory,locationEvidence} from './social-forum-evidence.mjs';
export async function xSearch(env=process.env,request=fetch){
 if(env.X_API_ENABLED!=='true')return {status:'X接口已实现，待确认访问资格与调用费用',items:[]};
 if(!env.X_BEARER_TOKEN)return {status:'未配置 X_BEARER_TOKEN',items:[]};
 try{
  const params=new URLSearchParams({query:'(construction OR waterproofing OR cladding) -is:retweet',max_results:'10','tweet.fields':'created_at,author_id,public_metrics,entities','expansions':'author_id','user.fields':'username'});
  const data=await jsonRequest('https://api.x.com/2/tweets/search/recent?'+params,{headers:{Authorization:'Bearer '+env.X_BEARER_TOKEN}},request);
  const users=new Map((data.includes?.users||[]).map(u=>[u.id,u.username]));
  const observedAt=new Date().toISOString();
  return {status:data.errors?.length?'X接口部分结果，存在字段或访问缺口':'X关键词样本读取成功（非地区热榜）',items:(data.data||[]).filter(p=>/^\d+$/.test(p.id)&&p.text).map(p=>({title:p.text,url:'https://x.com/i/web/status/'+p.id,author:users.get(p.author_id)||null,publishedAt:p.created_at||null,metrics:p.public_metrics||{},metricsObservedAt:observedAt,market:'市场未确认',tags:p.entities?.hashtags?.map(h=>h.tag)||[],bgm:null,sourceKind:'keyword_sample'}))};
 }catch(e){return {status:'X接口失败；需核对令牌、访问级别或额度',error:/^HTTP_\d+$/.test(e.message)?e.message:e.name,items:[]};}
}
export function discoverThreads(html,base){
 const root=new URL(base),seen=new Set(),items=[];
 for(const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  try{const u=new URL(m[1].replaceAll('&amp;','&'),root);if(u.origin!==root.origin||!/^\/threads\/[^/]+\.\d+\/$/.test(u.pathname))continue;
   const title=m[2].replace(/<[^>]*>/g,'').trim();if(!title||/^(latest|last|new|\d+|.*\bago|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d.+)$/i.test(title)||/community rules|pros.only|terms|privacy|welcome/i.test(title)||seen.has(u.pathname))continue;
   seen.add(u.pathname);u.search='';u.hash='';items.push({title,url:u.href,author:null,publishedAt:null,metrics:{},market:'市场未确认',tags:null,bgm:null,sourceKind:'forum_discovery'});
  }catch{}
 }
 return items.slice(0,4);
}
export async function forumSample(source,html,request=fetch){
 const items=discoverThreads(html,source.url);
 const categoryCache=new Map();
 for(const item of items){
  try{const read=await publicText(item.url,{request,timeoutMs:12000});
   item.accessAttempts=read.attempts;
   if(!read.ok){item.detail={status:'发现原帖链接，单帖访问失败',failureKind:read.kind};continue;}
   const body=read.body,parsed=parseForum(body);
   const heading=body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]*>/g,'').trim();
   Object.assign(item,parsed,{...(heading?{title:heading}:{}),metricsObservedAt:new Date().toISOString(),detail:{status:parsed.author&&parsed.publishedAt?'首帖元数据已提取':'候选原帖，元数据仍有缺口'}});
   item.projectLocation=locationEvidence(item.title,body,item.url);
   // Only retain statistics explicitly associated with this thread.
   item.metrics=threadStatistics(body,item.url);
   const category=forumCategory(body,item.url);
   if(category&&!Object.keys(item.metrics).length){
    if(!categoryCache.has(category))categoryCache.set(category,await publicText(category,{request,timeoutMs:12000}));
    const listing=categoryCache.get(category);item.metricAttempts=listing.attempts;
    if(listing.ok){const found=threadStatistics(listing.body,item.url);if(Object.keys(found).length){item.metrics=found;item.metricsSource=category;}}
   }
   item.detail.metricsStatus=Object.keys(item.metrics).length?'帖子级指标已提取':'来源未提供可核验的帖子级指标';
  }catch{item.detail={status:'发现原帖链接，单帖访问失败'};}
 }
 return items.filter(i=>!/community rules|pros.only|terms|privacy|welcome/i.test(i.title)&&(!i.publishedAt||Date.parse(i.publishedAt)>=Date.now()-7*86400000));
}
export async function stableForumSource(source,options={}){
 const paths=[source.url,new URL('/',source.url).href],accessAttempts=[];
 for(const url of [...new Set(paths)]){
  const read=await publicText(url,options);accessAttempts.push(...read.attempts);
  if(!read.ok){
   if(['access_restricted','rate_limited','certificate_error'].includes(read.kind))return {...source,status:'公开来源受阻：'+read.kind,items:[],accessAttempts};
   continue;
  }
  const items=await forumSample(source,read.body,options.request||fetch);
  if(items.length)return {...source,status:'公开论坛候选（非热榜）',items,accessAttempts,selectedSource:url,observedAt:read.observedAt};
 }
 return {...source,status:'主备路径未取得近期有效主题',items:[],accessAttempts};
}
export function classify(title){
 const rules=[['工程与使用端',/waterproof|cladding|concrete|insulation|construction|roof|window|floor|防水|施工|混凝土|عزل|بناء/i],['上游资源端',/quarry|mining|aggregate|pigment|砂石|矿山/i],['流通渠道端',/wholesale|distributor|warehouse|logistics|批发|物流/i],['技术检测服务端',/laboratory|certification|bim|检测|认证/i],['监管行业配套',/regulation|association|exhibition|recycling|招标|展会/i],['终端散户',/homeowner|renovation|diy|装修|自建房/i]];
 return rules.find(([,r])=>r.test(title||''))?.[0]||'待分类';
}
export function enhanceDashboard(html,attempts){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 for(const source of attempts)if(source.accessAttempts?.length){
  const trace='<details><summary>公开路径尝试记录（'+source.accessAttempts.length+'次）</summary>'+source.accessAttempts.map(a=>'<p>'+esc(a.observedAt)+' · '+esc(a.url)+' · '+esc(a.httpStatus??a.errorCode??a.kind)+' · '+esc(a.kind)+' · '+esc(a.durationMs)+'ms</p>').join('')+'</details>';
  html=html.replace('<h2>'+esc(source.name)+'</h2>','<h2>'+esc(source.name)+'</h2>'+trace);
 }
 const items=attempts.flatMap(s=>s.items);let n=0;
 html=html.replaceAll('<section lang="und" dir="auto">',()=>{const i=items[n++];const market=['欧洲','北美','中东'].includes(i?.market)?i.market:'市场未确认';const place=i?.projectLocation;const info=place?.place?'<p>项目所在地线索：'+esc(place.place)+' · '+esc(place.status)+'。买家／受众市场仍未确认。</p>':'';return '<section lang="und" dir="auto" data-market="'+market+'" data-industry="'+classify(i?.title)+'">'+info;});
 const options=['全部行业','工程与使用端','上游资源端','流通渠道端','技术检测服务端','监管行业配套','终端散户','待分类'].map(v=>'<option>'+v+'</option>').join('');
 const controls='<div style="margin-bottom:16px"><label>市场 <select id="market-filter"><option>全部市场</option><option>市场未确认</option><option>欧洲</option><option>北美</option><option>中东</option></select></label> <label>行业关键词初筛 <select id="industry-filter">'+options+'</select></label><p>行业按标题关键词初筛，不代表已确认客户角色；当前市场均待核验。</p><p id="filter-count" aria-live="polite"></p></div>';
 html=html.replace('<div id="sources"',controls+'<div id="sources"');
 const script=`<script>(()=>{const q=document.querySelector('#search'),m=document.querySelector('#market-filter'),r=document.querySelector('#industry-filter');function update(){let count=0;document.querySelectorAll('#sources article').forEach(a=>{const sections=[...a.querySelectorAll('section[data-industry]')];sections.forEach(s=>{s.hidden=(m.value!=='全部市场'&&m.value!==s.dataset.market)||(r.value!=='全部行业'&&s.dataset.industry!==r.value);if(!s.hidden)count++});a.hidden=!a.dataset.name.toLowerCase().includes(q.value.toLowerCase())||((r.value!=='全部行业'||m.value!=='全部市场')&&!sections.some(s=>!s.hidden))});document.querySelector('#filter-count').textContent='筛选后显示 '+[...document.querySelectorAll('#sources article:not([hidden]) section:not([hidden])')].length+' 条候选'};[q,m,r].forEach(e=>e.addEventListener(e===q?'input':'change',update));update()})();</script>`;
 return html.replace('</body>',script+'</body>');
}
