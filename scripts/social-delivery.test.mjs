import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDelivery,windowFor,renderDelivery} from './social-delivery.mjs';
const now=Date.parse('2026-11-16T02:00:00Z');
const item={title:'<unsafe>',url:'https://example.com/post',publishedAt:'2026-11-15T01:00:00Z',metrics:{likes:0,comments:null},market:'北美'};
const source=(items,observedAt=new Date(now).toISOString())=>({attempts:[{name:'YouTube',observedAt,status:'sample',items}]});
test('delivery rejects stale observations, old posts, duplicates, future dates and unsafe URLs',()=>{
 const d=buildDelivery(source([item,item,{...item,url:'https://example.com/old',publishedAt:'2020-01-01'},{...item,url:'javascript:alert(1)'},{...item,url:'https://example.com/future',publishedAt:'2027-01-01'}]),{}, {now});
 assert.equal(d.records.length,1);assert.equal(d.excluded.length,4);
 assert.equal(buildDelivery(source([item],'2026-11-13'),{}, {now}).records.length,0);
 assert.deepEqual(d.records[0].metrics,{likes:0});assert.equal(d.records[0].market,'市场未确认');assert.equal(d.matrix.length,21);assert.equal(d.complete,false);
 assert.ok(renderDelivery(d).includes('&lt;unsafe&gt;'));assert.ok(!renderDelivery(d).includes('<unsafe>'));
});
test('weekly boundary uses Monday midnight Shanghai while daily keeps seven-day industry window',()=>{
 assert.equal(new Date(windowFor(now,'weekly').start).toISOString(),'2026-11-15T16:00:00.000Z');
 assert.equal(buildDelivery(source([item]),{}, {now,kind:'weekly'}).records.length,0);
 assert.equal(buildDelivery(source([item]),{}, {now,kind:'daily'}).records.length,1);
});
test('foreign-only delivery excludes domestic and unknown sources even when records are fresh',()=>{
 const p=source([item]);
 for(const name of ['抖音','微博','今日头条','unknown'])p.attempts.push({name,observedAt:new Date(now).toISOString(),items:[{...item,url:'https://example.com/'+encodeURIComponent(name)}]});
 const d=buildDelivery(p,{}, {now});
 assert.deepEqual(d.records.map(r=>r.platform),['YouTube']);
 assert.equal(d.excluded.length,4);
 assert.equal(d.coverage.length,1);
});
