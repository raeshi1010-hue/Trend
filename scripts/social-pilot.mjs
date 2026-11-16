import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'docs/social');
const sources=[
 ['Instagram','https://www.instagram.com/explore/tags/construction/','视频、图片、标签；公开页面未必返回原帖','音频名称/链接需单帖读取'],
 ['Facebook','https://www.facebook.com/search/posts/?q=construction','公共主页/群组；搜索可能需登录','Reels音频需单帖核验'],
 ['X','https://x.com/search?q=construction&f=live','帖子、转帖、回复；搜索可能需授权','无通用BGM字段'],
 ['YouTube','https://www.youtube.com/results?search_query=construction+saudi','视频标题、视频ID；统计优先Data API','音乐署名不等于热门音频榜'],
 ['TikTok','https://www.tiktok.com/tag/construction','视频、话题；Research API需要资格及授权','music_id不等于音频名称或授权'],
 ['Reddit','https://www.reddit.com/r/Construction/new.json?limit=10','帖子、分数、评论数；接口可能限制匿名访问','不适用一般文字帖'],
 ['LinkedIn','https://www.linkedin.com/search/results/content/?keywords=construction','项目、采购和从业者讨论；搜索可能需登录','无通用BGM字段'],
 ['Houzz','https://www.houzz.com/discussions','家装、自建房、设计讨论','一般不适用'],
 ['Screwfix Community','https://community.screwfix.com/forums/builders-talk.23/index.rss','英国施工论坛RSS：标题、日期、讨论直链；互动另查','不适用'],
 ['DIYnot','https://www.diynot.com/diy/forums/building/index.rss','英国装修施工论坛RSS；可用性需试采','不适用'],
 ['ContractorTalk','https://www.contractortalk.com/forums/','承包商论坛：讨论、回复及浏览量需页面核验','不适用'],
 ['SkyscraperCity','https://www.skyscrapercity.com/forums/','项目、城市建设及中东工程讨论','一般不适用']
].map(([name,url,fields,bgm])=>({name,url,fields,bgm}));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=s=>s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').trim();
const tag=(s,t)=>plain(s.match(new RegExp('<'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+t+'>','i'))?.[1]||'');
const attempts=await Promise.all(sources.map(async source=>{
 const observedAt=new Date().toISOString();
 try{
  const r=await fetch(source.url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'Trend-source-pilot/1.0 (public source availability test)'}});
  const body=(await r.text()).slice(0,1500000);
  const items=[];
  if(r.ok&&source.name==='Reddit'){
   try{for(const {data:d} of JSON.parse(body).data.children){if(!d.permalink)continue;items.push({title:d.title,url:'https://www.reddit.com'+d.permalink,publishedAt:new Date(d.created_utc*1000).toISOString(),metrics:{score:d.score,comments:d.num_comments},market:'市场未确认',tags:null,bgm:null});}}catch{}
  } else if(r.ok&&/<rss[\s>]|<feed[\s>]/i.test(body)){
   for(const m of body.matchAll(/<item[\s>]([\s\S]*?)<\/item>/gi)){const title=tag(m[1],'title'),url=tag(m[1],'link');if(title&&/^https:\/\//.test(url))items.push({title,url,publishedAt:tag(m[1],'pubDate')||null,metrics:{},market:'市场未确认',tags:null,bgm:null});}
  }
  const feedTitle=tag(body.split(/<item[\s>]/i)[0],'title');
  const sourceMismatch=source.name==='DIYnot'&&items.length>0&&!/building/i.test(feedTitle);
  if(sourceMismatch)items.length=0;
  const status=!r.ok?'HTTP '+r.status:sourceMismatch?'RSS分区不匹配，已排除':items.length?'已提取结构化原帖候选':/just a moment|access denied/i.test(plain(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''))||/\/(login|uas\/login)(\/|\?)/i.test(r.url)?'访问受限/需人工确认':'页面可达，尚未提取原帖';
  return {...source,observedAt,httpStatus:r.status,status,items:items.slice(0,10),bytes:Buffer.byteLength(body),pageTitle:plain(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||''),finalUrl:r.url};
 }catch(e){return {...source,observedAt,status:e.name==='TimeoutError'?'请求超时':'网络请求失败',error:e.cause?.code||e.name,items:[]};}
}));
await fs.mkdir(out,{recursive:true});
const result={observedAt:new Date().toISOString(),runtime:{platform:process.platform,node:process.version,githubActions:process.env.GITHUB_ACTIONS==='true',runId:process.env.GITHUB_RUN_ID||null,commit:process.env.GITHUB_SHA||null},scope:'公开路径一次性试采；页面可达不代表原帖、市场和热度核验通过',attempts};
await fs.writeFile(path.join(out,'pilot.json'),JSON.stringify(result,null,2));
const cards=attempts.map(s=>`<article data-name="${escape(s.name)}"><div class="pill">${escape(s.status)}</div><h2>${escape(s.name)}</h2><p>${escape(s.fields)}</p><p>BGM：${escape(s.bgm)}</p><p class="muted">本次原帖候选 ${s.items.length} 条 · ${escape(s.observedAt)}</p><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">查看试采入口 ↗</a>${s.items.map(i=>`<section lang="und" dir="auto"><h3><a href="${escape(i.url)}" target="_blank" rel="noopener noreferrer">${escape(i.title)}</a></h3><p>${escape(i.publishedAt||'首发日期待核验')}</p><p>${escape(JSON.stringify(i.metrics))} · ${escape(i.market)}</p><p>标签、BGM、行业角色及创作建议：待原帖核验</p></section>`).join('')}</article>`).join('');
const html=`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>建材全球社媒观察 · 数据源试采</title><style>body{margin:0;background:#edf3ee;color:#153c30;font:16px/1.7 system-ui}main{max-width:1200px;margin:auto;padding:36px 24px}header{background:#153c30;color:white;padding:28px;border-radius:18px}h1{font-size:32px;margin:0}nav{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}button,input{font:inherit;padding:9px 14px;border:1px solid #b7cabc;border-radius:8px;background:white}button{cursor:pointer}button[aria-pressed=true]{background:#153c30;color:white}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}article{background:white;border:1px solid #d4dfd5;padding:24px;border-radius:14px;overflow-wrap:anywhere}.pill{background:#fff0ca;display:inline-block;padding:3px 12px;border-radius:20px;font-size:13px}a{color:#176b50}.muted,footer{font-size:13px;color:#526b5c}section{border-top:1px solid #d4dfd5;margin-top:20px}aside{padding:18px;background:#fff7df;border-radius:10px;margin-top:16px}[hidden]{display:none!important}@media(max-width:700px){.grid{grid-template-columns:1fr}h1{font-size:25px}}</style></head><body><main><header><p>欧洲 / 北美 / 中东 · 建材产业链</p><h1>全球社媒与行业论坛观察</h1><p>第一阶段：平台梳理与公开路径试采</p><p>日报目标 09:00 · 周报目标 周五16:00 · 北京时间</p></header><aside>这是来源能力试采，不是完整趋势日报。未核验市场、日期和互动数据的候选不计入热门榜。尚未建立BGM榜或自动日周报部署。帖子标题保留抓取到的原语言，中文为导航和说明。</aside><nav><button aria-pressed="true" data-tab="sources">数据源试采</button><button aria-pressed="false" data-tab="scope">监测范围与规则</button><input id="search" aria-label="搜索平台" placeholder="搜索平台或论坛"></nav><div id="sources" class="grid">${cards}</div><article id="scope" hidden><h2>工程与使用端优先</h2><p>上游资源 · 流通渠道 · 工程与使用 · 技术检测服务 · 监管行业配套 · 终端业主</p><p>国家样本优先：英国、德国、法国、美国、加拿大、阿联酋、沙特。原帖语言不能作为市场归属证据。市场未确认的内容单列。</p><p>热门话题、原帖标签、BGM及内容创作建议分别呈现。无指标不判热门，无跨期数据不判升温。每来源最多展示20条，不以虚构内容补齐。</p><p>日报热点窗口最近24小时；行业首发最近7天。周报本周一至运行时。原帖只保留标题、必要短摘和链接。</p><a href="../../config/social-monitoring-requirements.md">完整监测需求</a></article><footer>试采时间 ${escape(result.observedAt)} · <a href="pilot.json">下载试采记录 JSON</a> · HTTP成功只代表本次路径可达</footer></main><script>const tabs=document.querySelectorAll('[data-tab]'),q=document.querySelector('#search');function filter(){document.querySelectorAll('#sources article').forEach(a=>a.hidden=!a.dataset.name.toLowerCase().includes(q.value.toLowerCase()))}q.addEventListener('input',filter);tabs.forEach(b=>b.addEventListener('click',()=>{tabs.forEach(t=>t.setAttribute('aria-pressed',String(t===b)));document.querySelector('#sources').hidden=b.dataset.tab!=='sources';document.querySelector('#scope').hidden=b.dataset.tab!=='scope';q.hidden=b.dataset.tab!=='sources'}));</script></body></html>`;
await fs.writeFile(path.join(out,'index.html'),html);
console.log(JSON.stringify(attempts.map(({name,status,items})=>({name,status,count:items.length})),null,2));
