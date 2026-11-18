import {publicText} from './social-public-http.mjs';
const clean=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,'').trim();
const tag=(s,t)=>clean(s.match(new RegExp('<'+t+'(?:\\s[^>]*)?>([\\s\\S]*?)</'+t+'>','i'))?.[1]);
export function structuredItems(body,source){
 const origin=new URL(source.url),items=[],seen=new Set();
 const add=p=>{try{const u=new URL(p.url,origin);if(u.protocol!=='https:'||u.hostname.replace(/^www\./,'')!==origin.hostname.replace(/^www\./,'')||u.username||u.password||!p.title||seen.has(u.href)||u.pathname==='/')return;seen.add(u.href);items.push({...p,url:u.href,market:'市场未确认',tags:null,bgm:null,coverage:'行业公开内容',sourceKind:'public_structured_sample',detail:{status:'公开结构化候选；首帖、市场和热度仍待核验'}});}catch{}};
 for(const m of body.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi))add({title:tag(m[1],'title'),url:tag(m[1],'link'),author:tag(m[1],'dc:creator')||null,publishedAt:tag(m[1],'pubDate')||null,metrics:{}});
 const walk=v=>{if(Array.isArray(v)){v.forEach(walk);return;}if(!v||typeof v!=='object')return;
  const types=[v['@type']].flat();if(types.some(t=>['DiscussionForumPosting','SocialMediaPosting','NewsArticle','Article','BlogPosting'].includes(t))){const author=typeof v.author==='string'?v.author:v.author?.name||v.author?.[0]?.name||null;add({title:clean(v.headline||v.name),url:typeof v.url==='string'?v.url:typeof v.mainEntityOfPage==='string'?v.mainEntityOfPage:v.mainEntityOfPage?.['@id'],author,publishedAt:v.datePublished||null,metrics:{}});}
  for(const [k,x]of Object.entries(v))if(k!=='author'&&x&&typeof x==='object')walk(x);
 };
 for(const m of body.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{walk(JSON.parse(m[1]));}catch{}
 return items.slice(0,20);
}
export async function structuredSource(source,options={}){
 const read=await publicText(source.url,options);
 if(!read.ok)return {...source,status:'公开来源受阻：'+read.kind,items:[],accessAttempts:read.attempts,coverage:'行业公开内容'};
 const items=structuredItems(read.body,source);
 return {...source,observedAt:read.observedAt,status:items.length?'公开结构化候选（非热榜）':'页面可达，未取得可核验结构化帖子',items,accessAttempts:read.attempts,coverage:'行业公开内容'};
}
