const retryStatuses=new Set([408,500,502,503,504]);
const retryCodes=new Set(['ECONNRESET','ETIMEDOUT','EAI_AGAIN','UND_ERR_CONNECT_TIMEOUT','UND_ERR_HEADERS_TIMEOUT','UND_ERR_SOCKET']);
export function failureKind(status,code){
 if(status===429)return 'rate_limited';
 if([401,403,451].includes(status))return 'access_restricted';
 if(status===404)return 'not_found';
 if(retryStatuses.has(status))return 'temporary_server_error';
 if(/CERT|SIGNATURE|TLS|SSL/.test(code||''))return 'certificate_error';
 if(['TimeoutError','AbortError'].includes(code)||retryCodes.has(code))return 'temporary_network_error';
 return 'request_failed';
}
// Public URLs only. Never send credentials; never disable TLS or retry access restrictions.
export async function publicText(url,{request=fetch,pause=ms=>new Promise(r=>setTimeout(r,ms)),timeoutMs=15000}={}){
 const attempts=[];
 for(let n=1;n<=2;n++){
  const start=Date.now(),observedAt=new Date().toISOString();let response;
  try{
   response=await request(url,{signal:AbortSignal.timeout(timeoutMs),redirect:'error',headers:{'User-Agent':'Trend-source-pilot/1.0 (public forum sample)'}});
   if(!response.ok){
    const kind=failureKind(response.status);
    attempts.push({url,attempt:n,observedAt,durationMs:Date.now()-start,httpStatus:response.status,kind});
    if(n===1&&retryStatuses.has(response.status)){await pause(1000);continue;}
    return {ok:false,kind,attempts};
   }
   const body=(await response.text()).slice(0,1500000);
   attempts.push({url,attempt:n,observedAt,durationMs:Date.now()-start,httpStatus:response.status,kind:'success'});
   return {ok:true,body,observedAt,attempts};
  }catch(e){
   const code=e.cause?.code||e.name,kind=failureKind(null,code);
   attempts.push({url,attempt:n,observedAt,durationMs:Date.now()-start,kind,errorCode:code});
   if(n===1&&kind==='temporary_network_error'){await pause(1000);continue;}
   return {ok:false,kind,attempts};
  }
 }
}
