import fs from 'node:fs/promises';
import {structuredSource} from './social-structured.mjs';
const sources=[{name:'Houzz',url:'https://www.houzz.com/discussions'},{name:'Screwfix Community',url:'https://community.screwfix.com/forums/builders-talk.23/index.rss'},{name:'ArchDaily',url:'https://www.archdaily.com/feed/'},{name:'The Construction Index',url:'https://www.theconstructionindex.co.uk/feeds/news.xml'},{name:'Behance',url:'https://www.behance.net/galleries/architecture'},{name:'Pinterest',url:'https://trends.pinterest.com/'}];
// Reuse same-run probes; don't request Houzz and Screwfix twice.
const pilot=JSON.parse(await fs.readFile('docs/social/pilot.json','utf8'));
const results=await Promise.all(sources.map(source=>pilot.attempts.find(s=>s.name===source.name)||structuredSource(source,{timeoutMs:10000})));
await fs.writeFile('docs/social/public-acceptance.json',JSON.stringify({observedAt:new Date().toISOString(),note:'本机公开路径实测；不覆盖既有pilot快照。页面无结构化数据不代表没有内容。',results},null,2));
console.log(JSON.stringify(results.map(({name,status,items})=>({name,status,count:items.length})),null,2));
