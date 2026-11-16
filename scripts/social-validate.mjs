import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=JSON.parse(await fs.readFile(path.join(root,'docs/social/pilot.json'),'utf8'));
const html=await fs.readFile(path.join(root,'docs/social/index.html'),'utf8');
assert.equal(data.attempts.length,12,'Expected all twelve attempted sources');
assert.equal(new Set(data.attempts.map(s=>s.name)).size,12);
for(const source of data.attempts){
 assert(Number.isFinite(Date.parse(source.observedAt)),source.name+' missing observation time');
 assert(Array.isArray(source.items));
 assert(source.items.length<=10);
 assert(html.includes(source.name.replace(/&/g,'&amp;')),source.name+' missing in dashboard');
 for(const item of source.items){
  assert(item.title?.trim(),'Empty candidate title');
  assert.equal(new URL(item.url).protocol,'https:');
  assert.equal(item.market,'市场未确认','Pilot must not infer market from language');
 }
}
for(const m of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new Function(m[1]);
const rows=data.attempts.map(s=>`| ${s.name} | ${s.status} | ${s.httpStatus??'—'} | ${s.items.length} |`);
const summary=['# 社媒公开来源试采',`观察时间：${data.observedAt}`,'页面可达与候选提取不等于日期、市场、热度或BGM核验通过。',`运行环境：${data.runtime?.platform??'unknown'} / Node ${data.runtime?.node??'unknown'}`,'| 来源 | 状态 | HTTP | 原帖候选数 |','|---|---|---|---|',...rows,'','下载本次运行的 artifact，解压后打开 docs/social/index.html 查看看板。工作流通过仅代表试采和结构验证完成，不能视为采集覆盖成功。'].join('\n');
if(process.env.GITHUB_STEP_SUMMARY)await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,summary+'\n');
console.log(summary);
