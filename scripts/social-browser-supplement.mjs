// Public browser observations from 2026-11-18; never refresh observation dates automatically.
const samples=[
 {platform:'Instagram',author:'PERI Formwork & Scaffolding',url:'https://www.instagram.com/pericorporate/reel/DfpaGdBiOzW/',title:'Ready for the next level?',publishedAt:'2026-11-12T15:45:33.000Z',observedOn:'2026-11-18',likes:126,projectRegion:'北美',basis:'原帖明确描述 Chicago 高层施工；仅核实项目地点，不代表买家或受众',summary:'随楼层移动的施工防护屏，涉及折叠运输、销连接和可替换面板。供应商发布，技术性能未独立检验。',tags:'#PERI #highrise #construction #safety #formwork',audio:'页面标注原创音频，热门程度未核实'},
 {platform:'Facebook',author:'PERI USA',url:'https://www.facebook.com/reel/1513005194003934/',title:'The PERI DUO Black Friday Sale is on now!',publishedAt:null,publishedDisplay:'页面显示2026-11-17 22:01；时区未确认',observedOn:'2026-11-18',likes:4,projectRegion:null,basis:'主页链接peri-usa.com，仅为美国品牌渠道，未确认项目地点或受众',summary:'DUO模板面板、配件和柱模套件促销，属于供应商推广，不代表采购需求。',tags:'#PERI #DUO #BlackFriday #Formwork',audio:'未核实'}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function browserSupplement(data){
 // Only show the original observation day. Missing exact observation time must not become a fresh metric next day.
 const visible=samples.filter(s=>s.observedOn===data.day).map(s=>({...s,withinWindow:!!s.publishedAt&&Date.parse(s.publishedAt)>=Date.parse(data.window.start)&&Date.parse(s.publishedAt)<=Date.parse(data.window.end)}));
 return {observedOn:'2026-11-18',automatic:false,samples:visible};
}
export function renderBrowserSupplement(data){
 const supplement=data.browserSupplement||browserSupplement(data);
 if(!supplement.samples.length)return '';
 return '<h2>浏览器核验补充（'+supplement.samples.length+'条）</h2><p>免费登录态人工读取，非自动API；观察日期2026年11月18日，精确观察时刻未保存。下列累计指标不纳入自动候选数量或地区热榜。项目地点与受众市场分别说明；次日不自动重放旧指标。</p><section>'+supplement.samples.map(s=>'<article data-platform="'+esc(s.platform)+'" data-market="市场未确认"><small>'+esc(s.platform)+' · 浏览器样本 · 受众市场未确认</small><h2><a target="_blank" rel="noopener noreferrer" href="'+esc(s.url)+'">'+esc(s.title)+'</a></h2><p>作者：'+esc(s.author)+'</p><p>首发：'+esc(s.publishedAt?new Date(Date.parse(s.publishedAt)+28800000).toISOString().replace('T',' ').replace('.000Z',' 北京时间'):s.publishedDisplay)+'</p><p>本期窗口：'+(s.withinWindow?'首发在本期窗口内':'未纳入本期有效计数：首发时间未核实或不在窗口')+'</p><p>项目地点：'+esc(s.projectRegion||'未确认')+'；'+esc(s.basis)+'</p><p>'+esc(s.summary)+'</p><p>观察时点赞：'+s.likes+'；不代表本期增量或热榜排名。</p><p>原帖标签：'+esc(s.tags)+'<br>音频：'+esc(s.audio)+'</p></article>').join('')+'</section>';
}
