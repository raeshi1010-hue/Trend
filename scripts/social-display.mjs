export function beijingTime(value){
 const date=new Date(value);
 if(!value||!Number.isFinite(date.getTime()))return '未取得';
 return new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).format(date)+'（北京时间）';
}
export function mentionedPlaces(title){
 const places=[['沙特','中东',/\bSaudi(?: Arabia)?\b|沙特/iu],['阿联酋','中东',/\bUAE\b|United Arab Emirates|阿联酋/iu],['美国','北美',/United States|\bUSA\b|美国/iu],['加拿大','北美',/\bCanada\b|加拿大/iu],['英国','欧洲',/United Kingdom|\bUK\b|英国/iu],['德国','欧洲',/\bGermany\b|德国/iu],['法国','欧洲',/\bFrance\b|法国/iu],['印度','其他地区',/\bIndia\b|印度/iu]];
 return places.filter(([, ,pattern])=>pattern.test(title||'')).map(([country,region,pattern])=>({country,region,evidence:String(title).match(pattern)[0]}));
}
