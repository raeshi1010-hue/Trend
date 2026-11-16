const plain=s=>String(s??'').replace(/<[^>]*>/g,'').trim();
const iso=s=>s&&Number.isFinite(Date.parse(s))?new Date(s).toISOString():null;
export function originalPost(html){
 // XenForo explicitly labels the thread starter and start date in the thread header.
 const header=html.match(/<div\b[^>]*class=["'][^"']*\bp-description\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
 if(header&&/thread starter|start date/i.test(header)){
  const author=plain(header.match(/<a\b[^>]*class=["'][^"']*\busername\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i)?.[1])||null;
  const publishedAt=iso(header.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1]);
  if(author&&publishedAt)return {author,publishedAt,metadataSource:'线程头明确标注Thread starter / Start date',firstPostConfirmed:true};
 }
 for(const a of html.matchAll(/<article\b([^>]*\bdata-author=["']([^"']+)["'][^>]*)>([\s\S]*?)<\/article>/gi)){
  // A visible reply can be the first article in HTML. Only explicit post number 1 qualifies.
  const attribution=a[3].match(/<header\b[^>]*class=["'][^"']*message-attribution[^"']*["'][^>]*>([\s\S]*?)<\/header>/i)?.[1]||'';
  if(!/<a\b[^>]*>\s*#1\s*<\/a>/i.test(attribution))continue;
  const publishedAt=iso(attribution.match(/<time\b[^>]*datetime=["']([^"']+)["']/i)?.[1]);
  if(publishedAt)return {author:plain(a[2]),publishedAt,metadataSource:'明确编号#1的帖子',firstPostConfirmed:true};
 }
 return {author:null,publishedAt:null,metadataSource:'未找到明确首帖证据',firstPostConfirmed:false};
}
