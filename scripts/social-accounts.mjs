import {jsonRequest} from './social-adapters.mjs';
const date=v=>v!=null&&Number.isFinite(Date.parse(v))?new Date(v).toISOString():null;
const metrics=(p,keys)=>Object.fromEntries(keys.filter(k=>p[k]!=null&&Number.isFinite(Number(p[k]))&&Number(p[k])>=0).map(k=>[k,Number(p[k])]));
const tags=s=>[...String(s||'').matchAll(/#([\p{L}\p{N}_]+)/gu)].map(m=>m[1]);
const safeLink=(value,host)=>{try{const u=new URL(value);return u.protocol==='https:'&&(u.hostname===host||u.hostname.endsWith('.'+host))?u.href:null;}catch{return null;}};
const base=(title,url,author,publishedAt,m={})=>({title:String(title||'').slice(0,1000),url,author:author||null,publishedAt:date(publishedAt),metrics:m,metricsObservedAt:new Date().toISOString(),market:'市场未确认',tags:tags(title),bgm:null,sourceKind:'authorized_account_sample',coverage:'自有／已授权账号',detail:{status:'官方账号样本；不代表全网趋势，音频及市场未核验'}});
const required={Instagram:['INSTAGRAM_ACCESS_TOKEN','INSTAGRAM_USER_ID','META_API_VERSION'],Facebook:['FACEBOOK_PAGE_ACCESS_TOKEN','FACEBOOK_PAGE_ID','META_API_VERSION'],TikTok:['TIKTOK_ACCESS_TOKEN'],LinkedIn:['LINKEDIN_ACCESS_TOKEN','LINKEDIN_ORGANIZATION_ID','LINKEDIN_API_VERSION']};
export async function accountSource(name,env=process.env,request=fetch){
 const missing=required[name]?.filter(k=>!env[k]?.trim());
 if(!missing)throw Error('Unsupported platform');
 if(missing.length)return {status:'账号适配器已实现，缺少配置：'+missing.join('、'),items:[],coverage:'自有／已授权账号',publicCoverage:'行业公开话题／第三方账号路径尚未接通'};
 try{
  let items=[],hasMore=false;
  const auth=token=>({headers:{Authorization:'Bearer '+token}});
  if(['Instagram','Facebook'].includes(name)){
   if(!/^v\d+\.\d+$/.test(env.META_API_VERSION))throw Error('INVALID_CONFIG');
   const id=env[name==='Instagram'?'INSTAGRAM_USER_ID':'FACEBOOK_PAGE_ID'];if(!/^\d+$/.test(id))throw Error('INVALID_CONFIG');
   const ig=name==='Instagram',fields=ig?'id,caption,permalink,timestamp,username,like_count,comments_count':'id,message,permalink_url,created_time,from';
   const url=`https://${ig?'graph.instagram.com':'graph.facebook.com'}/${env.META_API_VERSION}/${id}/${ig?'media':'posts'}?`+new URLSearchParams({fields,limit:'10'});
   const data=await jsonRequest(url,auth(env[ig?'INSTAGRAM_ACCESS_TOKEN':'FACEBOOK_PAGE_ACCESS_TOKEN']),request);
   if(data.error||!Array.isArray(data.data))throw Error('API_RESPONSE');
   hasMore=!!data.paging?.next;
   items=data.data.slice(0,10).map(p=>base(ig?p.caption:p.message,safeLink(ig?p.permalink:p.permalink_url,ig?'instagram.com':'facebook.com'),ig?p.username:p.from?.name,ig?p.timestamp:p.created_time,ig?metrics(p,['like_count','comments_count']):{}));
  }else if(name==='TikTok'){
   const fields='id,title,video_description,share_url,create_time,view_count,like_count,comment_count,share_count';
   const data=await jsonRequest('https://open.tiktokapis.com/v2/video/list/?'+new URLSearchParams({fields}),{method:'POST',headers:{Authorization:'Bearer '+env.TIKTOK_ACCESS_TOKEN,'Content-Type':'application/json'},body:JSON.stringify({max_count:10})},request);
   if(data.error?.code!=='ok'||!Array.isArray(data.data?.videos))throw Error('API_RESPONSE');
   hasMore=!!data.data.has_more;
   items=data.data.videos.slice(0,10).map(p=>base(p.video_description||p.title,safeLink(p.share_url,'tiktok.com'),null,Number.isFinite(p.create_time)?new Date(p.create_time*1000).toISOString():null,metrics(p,['view_count','like_count','comment_count','share_count'])));
  }else{
   if(!/^\d+$/.test(env.LINKEDIN_ORGANIZATION_ID)||!/^20\d{2}(0[1-9]|1[0-2])$/.test(env.LINKEDIN_API_VERSION))throw Error('INVALID_CONFIG');
   const author='urn:li:organization:'+env.LINKEDIN_ORGANIZATION_ID;
   const data=await jsonRequest('https://api.linkedin.com/rest/posts?'+new URLSearchParams({q:'author',author,count:'10',sortBy:'LAST_MODIFIED'}),{headers:{Authorization:'Bearer '+env.LINKEDIN_ACCESS_TOKEN,'LinkedIn-Version':env.LINKEDIN_API_VERSION,'X-Restli-Protocol-Version':'2.0.0'}},request);
   if(!Array.isArray(data.elements))throw Error('API_RESPONSE');
   hasMore=!!data.paging?.links?.some(l=>l.rel==='next');
   items=data.elements.filter(p=>p.author===author&&p.visibility==='PUBLIC'&&p.lifecycleState==='PUBLISHED'&&/^urn:li:(share|ugcPost):\d+$/.test(p.id)).slice(0,10).map(p=>base(p.commentary,'https://www.linkedin.com/feed/update/'+p.id,author,Number.isFinite(p.publishedAt)?new Date(p.publishedAt).toISOString():null));
  }
  return {status:'官方账号样本返回成功，仍需核对字段与授权范围',items:items.filter(p=>p.title.trim()&&p.url),coverage:'自有／已授权账号',publicCoverage:'行业公开话题／第三方账号路径尚未接通',hasMore,limitations:'每账号最多10条，不自动翻页；未取得互动不补0；不提供BGM热榜'};
 }catch(e){return {status:'账号接口失败；核对权限、令牌及API版本',error:/^HTTP_\d+$/.test(e.message)?e.message:['INVALID_CONFIG','API_RESPONSE'].includes(e.message)?e.message:'REQUEST_FAILED',items:[],coverage:'自有／已授权账号',publicCoverage:'行业公开话题／第三方账号路径尚未接通'};}
}
