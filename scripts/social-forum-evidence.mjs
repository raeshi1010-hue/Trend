import {parseForumListing} from './social-adapters.mjs';
export function linkedData(html){
 const nodes=[];
 const walk=x=>{if(Array.isArray(x))x.forEach(walk);else if(x&&typeof x==='object'){nodes.push(x);for(const v of Object.values(x))if(v&&typeof v==='object')walk(v);}};
 for(const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{walk(JSON.parse(m[1]));}catch{}}
 return nodes;
}
export function threadStatistics(html,url){
 const canonical=u=>{try{return new URL(u,url).pathname.replace(/\/$/,'')}catch{return null}};
 const node=linkedData(html).find(n=>[n['@type']].flat().includes('DiscussionForumPosting')&&canonical(n.url||n['@id'])===canonical(url));
 const metrics={};
 if(node){
  if(node.commentCount!=null&&/^\d+$/.test(String(node.commentCount)))metrics.replies=Number(node.commentCount);
  for(const s of [node.interactionStatistic].flat().filter(Boolean)){
   const t=typeof s.interactionType==='string'?s.interactionType:s.interactionType?.['@type'];const value=Number(s.userInteractionCount);
   if(!Number.isFinite(value)||value<0)continue;
   if(/ViewAction$/.test(t))metrics.views=value;
   if(/CommentAction$/.test(t))metrics.replies=value;
  }
 }
 const id=new URL(url).pathname.match(/\.(\d+)\/?$/)?.[1];
 return {...(parseForumListing(html).get(id)||{}),...forumRow(html,url).metrics,...metrics};
}
export function forumRow(html,url){
 const id=new URL(url).pathname.match(/\.(\d+)\/?$/)?.[1];
 const starts=[...html.matchAll(/<div\b[^>]*class=["'][^"']*structItem--thread[^"']*["'][^>]*>/gi)];
 const row=starts.map((m,i)=>html.slice(m.index,starts[i+1]?.index??html.length)).find(s=>new RegExp('href=["\'][^"\']*threads/[^"\']*\\.'+id+'/?["\']','i').test(s));
 if(!row)return {metrics:{},author:null,publishedAt:null};
 const metrics={};
 for(const [key,qid,label] of [['replies','reply','Replies'],['views','view','Views']]){
  const attrs=row.match(new RegExp('<(?:div|span)\\b[^>]*qid=["\']thread-item-'+qid+'-count["\'][^>]*>','i'))?.[0]||'';
  const raw=attrs.match(/\btitle=["']([^"']+)["']/i)?.[1]?.replace(new RegExp('\\s*'+label+'$','i'),'').trim();
  if(raw&&/^\d[\d,]*$/.test(raw))metrics[key]=Number(raw.replaceAll(',',''));
  else if(raw)metrics[key+'Display']=raw;
 }
 const author=row.match(/<a\b[^>]*qid=["']thread-item-username["'][^>]*>([\s\S]*?)<\/a>/i)?.[1]?.replace(/<[^>]*>/g,'').trim()||null;
 const date=row.match(/<li\b[^>]*class=["'][^"']*structItem-startDate[^"']*["'][^>]*>([\s\S]*?)<\/li>/i)?.[1]?.match(/datetime=["']([^"']+)["']/i)?.[1];
 return {metrics,author,publishedAt:date&&Number.isFinite(Date.parse(date))?new Date(date).toISOString():null};
}
export function forumCategory(html,url){
 const origin=new URL(url).origin,links=[];
 // Only schema breadcrumbs are used; sidebar, profile and unrelated category links are ignored.
 for(const n of linkedData(html).filter(n=>[n['@type']].flat().includes('BreadcrumbList'))){
  for(const e of n.itemListElement||[]){const value=typeof e.item==='string'?e.item:e.item?.['@id']||e.item?.url;
   try{const u=new URL(value,url);if(value&&u.origin===origin&&/^\/forums\/[^/]+\.\d+\/$/.test(u.pathname))links.push(u.href);}catch{}
  }
 }
 for(const crumb of breadcrumbLinks(html)){
  try{const u=new URL(crumb.url,url);if(u.origin===origin&&/^\/forums\/[^/]+\.\d+\/?$/.test(u.pathname))links.push(u.href);}catch{}
 }
 return links.at(-1)||null;
}
export function breadcrumbLinks(html){
 const links=[];
 // XenForo's semantic breadcrumb list only; never search the entire page for country names.
 for(const list of html.matchAll(/<ul\b[^>]*class=["'][^"']*p-breadcrumbs[^"']*["'][^>]*>([\s\S]*?)<\/ul>/gi)){
  for(const a of list[1].matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi))links.push({url:a[1].replaceAll('&amp;','&'),name:a[2].replace(/<[^>]*>/g,'').trim()});
 }
 return links;
}
export function locationEvidence(title,html,url){
 const places=[['Manchester','欧洲',/united kingdom|uk\b|manchester/i],['Dubai','中东',/united arab emirates|uae\b|dubai/i],['Riyadh','中东',/saudi arabia|riyadh/i],['London','欧洲',/united kingdom|uk\b|london/i],['Paris','欧洲',/france|paris/i],['Berlin','欧洲',/germany|berlin/i]];
 const p=places.find(([name])=>new RegExp('\\b'+name+'\\b','i').test(title||''));
 if(!p)return {status:'未确认',place:null};
 const crumbs=linkedData(html).filter(n=>[n['@type']].flat().includes('BreadcrumbList')).flatMap(n=>(n.itemListElement||[]).map(e=>e.name||e.item?.name||'')).filter(Boolean);
 crumbs.push(...breadcrumbLinks(html).map(c=>c.name).filter(Boolean));
 return {place:p[0],projectRegionHint:p[1],status:crumbs.some(c=>p[2].test(c))?'原帖标题与来源分区支持':'仅标题提及，待核验',evidence:{url,title,breadcrumbs:crumbs},audienceMarket:'未确认'};
}
