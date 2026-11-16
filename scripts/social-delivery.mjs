import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const DAY=86400000;
export const platforms=['TikTok','YouTube','Instagram','Facebook','LinkedIn','Reddit'];
const markets=['欧洲','北美','中东'];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function windowFor(now,kind){
 const shifted=new Date(now+8*3600000),day=shifted.toISOString().slice(0,10);
 const midnight=Date.parse(day+'T00:00:00+08:00');
 return {day,start:kind==='weekly'?midnight-((shifted.getUTCDay()+6)%7)*DAY:now-7*DAY,end:now,hotStart:kind==='weekly'?midnight-((shifted.getUTCDay()+6)%7)*DAY:now-DAY};
}
function safeUrl(value){try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return null;u.hash='';return u.href;}catch{return null;}}
export function buildDelivery(pilot,extra,{now=Date.now(),kind='daily'}={}){
 const window=windowFor(now,kind),sources=new Map();
 for(const s of [...(pilot.attempts||[]),...(extra.results||[])])if(!sources.has(s.name))sources.set(s.name,{...s,observedAt:s.observedAt||extra.observedAt});
 const records=[],excluded=[],seen=new Set(),coverage=[];
 for(const source of sources.values()){
  let kept=0;
  const observed=Date.parse(source.observedAt),fresh=Number.isFinite(observed)&&observed>=now-DAY&&observed<=now+300000;
  for(const item of source.items||[]){
   const url=safeUrl(item.url),published=Date.parse(item.publishedAt);
   const reason=!fresh?'采集结果过期或时间无效':!url||!item.title?.trim()?'缺少标题或有效原帖链接':!Number.isFinite(published)?'首发时间未取得':published>now?'首发时间在未来':published<window.start?'不在本期首发窗口':seen.has(url)?'重复原帖':kept>=20?'超过单来源20条上限':null;
   if(reason){excluded.push({platform:source.name,url,reason});continue;}
   seen.add(url);kept++;
   const metrics=Object.fromEntries(Object.entries(item.metrics||{}).filter(([,v])=>typeof v==='number'&&Number.isFinite(v)&&v>=0));
   // Region assignment requires explicit verified evidence; language and channel location are insufficient.
   const market=markets.includes(item.market)&&item.marketVerification==='verified'&&item.marketBasis?item.market:'市场未确认';
   records.push({platform:source.name,title:item.title,url,author:item.author||null,publishedAt:new Date(published).toISOString(),observedAt:source.observedAt,market,marketBasis:market==='市场未确认'?null:item.marketBasis,metrics,tags:item.tags??null,bgm:item.bgm??null,sourceKind:item.sourceKind||'disclosed_sample',block:'行业线索',withinHotWindow:published>=window.hotStart,note:'本次样本不代表地区热榜；累计互动不代表增长',suggestion:'创作建议：围绕原帖主题制作材料选择或施工问题讲解；发布前核对技术参数，不推断采购意向。'});
  }
  coverage.push({platform:source.name,status:source.status,observedAt:source.observedAt,stale:!fresh,raw:(source.items||[]).length,accepted:kept});
 }
 const matrix=markets.flatMap(market=>platforms.map(platform=>({market,platform,industryCount:records.filter(r=>r.market===market&&r.platform===platform).length,hotCount:0,status:'地区趋势与热度证据尚未完成验证'})));
 return {schemaVersion:1,kind,generatedAt:new Date(now).toISOString(),day:window.day,window:{start:new Date(window.start).toISOString(),end:new Date(now).toISOString(),hotStart:new Date(window.hotStart).toISOString()},runId:pilot.runtime?.runId||null,commit:pilot.runtime?.commit||null,complete:false,records,coverage,matrix,excluded,note:'自动生成的候选交付，覆盖不足时也交付缺口；周报为本周窗口内的当次样本，非全周累计；未验证地区、热点、BGM及跨期增量。'};
}
export function renderDelivery(data){
 const label=data.kind==='weekly'?'周报':'日报';
 const cards=data.records.map(r=>`<article data-platform="${esc(r.platform)}" data-market="${esc(r.market)}"><small>${esc(r.platform)} · ${esc(r.market)} · 行业线索</small><h2 lang="und"><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a></h2><p>作者：${esc(r.author||'未取得')}<br>首发：${esc(r.publishedAt)}<br>采集：${esc(r.observedAt)}</p><p>互动：${esc(Object.entries(r.metrics).map(([k,v])=>k+' '+v).join(' · ')||'未取得，不能视为0')}</p><p>原帖标签：${esc(r.tags===null?'未读取':r.tags.length?r.tags.join(' / '):'未返回标签')}<br>BGM：${esc(r.bgm||'未核验')}</p><p>${esc(r.suggestion)}</p><small>${esc(r.note)}</small></article>`).join('');
 const coverage=data.coverage.map(s=>`<tr><td>${esc(s.platform)}</td><td>${s.raw}</td><td>${s.accepted}</td><td>${esc(s.status)}${s.stale?'；数据过期':''}</td></tr>`).join('');
 return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${data.day} 建材社媒${label}</title><style>body{margin:0;background:#edf3ee;color:#153c30;font:16px/1.7 system-ui}main{max-width:1200px;margin:auto;padding:24px}header{padding:24px;background:#153c30;color:white;border-radius:16px}aside,article,details{background:white;border:1px solid #cadbce;border-radius:12px;padding:20px;margin:16px 0}section{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}article{margin:0;overflow-wrap:anywhere}h2{font-size:20px}a{color:#176b50}select{font:inherit;padding:8px;margin:12px}table{border-collapse:collapse;width:100%;font-size:14px}td,th{border-bottom:1px solid #cadbce;text-align:left;padding:8px}[hidden]{display:none!important}@media(max-width:700px){section{grid-template-columns:1fr}main{padding:12px}table{font-size:12px}}</style></head><body><main><header><h1>建材社媒${label} · ${data.day}</h1><p>欧洲 / 北美 / 中东 · 平台热点与行业线索</p><p>实际生成时间：${esc(data.generatedAt)} · 有效候选 ${data.records.length} 条</p></header><aside><strong>部分覆盖，尚未完成全平台自动采集</strong><p>${esc(data.note)}</p><p>行业窗口 ${esc(data.window.start)} 至 ${esc(data.window.end)}；热点窗口始于 ${esc(data.window.hotStart)}。</p><a href="data.json">本期数据</a> · <a href="manifest.json">校验清单</a></aside><h2>平台热点</h2><p>本期暂无具备地区和可比热度证据的榜单，不以行业候选填充。</p><details><summary>覆盖范围与来源状态（${data.coverage.length}个来源）</summary><table><tr><th>来源</th><th>原始候选</th><th>本期有效</th><th>状态</th></tr>${coverage}</table><p>六个平台 × 三个市场分别记录于本期数据 matrix；没有已核实地区数据的组合均披露缺口。</p></details><h2>行业线索</h2><label>平台<select id="platform"><option value="">全部</option>${[...new Set(data.records.map(r=>r.platform))].map(p=>`<option>${esc(p)}</option>`).join('')}</select></label><label>市场<select id="market"><option value="">全部</option>${[...markets,'市场未确认'].map(m=>`<option>${m}</option>`).join('')}</select></label><section>${cards||'<p>本期没有符合首发窗口的候选，请查看来源状态。</p>'}</section><p>剔除 ${data.excluded.length} 条（过期、缺字段或重复等），详情见本期数据。没有跨期可比证据，不判断升温或降温。</p></main><script>for(const s of document.querySelectorAll('select'))s.addEventListener('change',()=>{const p=document.querySelector('#platform').value,m=document.querySelector('#market').value;for(const a of document.querySelectorAll('article'))a.hidden=!!((p&&a.dataset.platform!==p)||(m&&a.dataset.market!==m))});</script></body></html>`;
}
export async function generate(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')){
 const out=path.join(root,'docs/social'),pilot=JSON.parse(await fs.readFile(path.join(out,'pilot.json'),'utf8')),extra=JSON.parse(await fs.readFile(path.join(out,'public-acceptance.json'),'utf8'));
 const now=Date.now(),files=[];
 for(const kind of ['daily','weekly']){
  const data=buildDelivery(pilot,extra,{kind,now}),relative=`delivery/${data.day}/${kind}`,dir=path.join(out,relative);
  await fs.mkdir(dir,{recursive:true});
  const payload={'index.html':renderDelivery(data),'data.json':JSON.stringify(data,null,2)};
  for(const [name,content] of Object.entries(payload))await fs.writeFile(path.join(dir,name),content);
  const manifest={generatedAt:data.generatedAt,runId:data.runId,kind,files:Object.entries(payload).map(([name,content])=>({name,sha256:createHash('sha256').update(content).digest('hex')}))};
  await fs.writeFile(path.join(dir,'manifest.json'),JSON.stringify(manifest,null,2));
  // Each date/type has separate files; no previous report is relabeled as current.
  files.push({kind,path:`${relative}/index.html`,accepted:data.records.length,excluded:data.excluded.length});
 }
 await fs.writeFile(path.join(out,'delivery/index.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>自动交付入口</title><h1>本次自动交付</h1><p><a href="current-delivery.zip">下载本期网页与数据ZIP</a></p><p>实际生成 ${new Date(now).toISOString()}；当前仅部分覆盖。</p>${files.map(f=>`<p><a href="${f.path.replace('delivery/','')}">${f.kind==='daily'?'日报':'周报'}：${f.accepted}条候选</a></p>`).join('')}</html>`);
 const summary='\n## 自动交付\n'+files.map(f=>`- ${f.kind}: ${f.accepted}条有效候选，剔除${f.excluded}条；${f.path}`).join('\n')+'\n覆盖缺口详见数据matrix和coverage，不代表全平台已接通。\n';
 if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,summary);
 console.log(summary);
 return files;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await generate();
