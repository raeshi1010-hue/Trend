import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assessItem,metricStructure} from './social-quality.mjs';
const now=Date.parse('2026-11-16T12:00:00Z');
const item={url:'https://f.test/threads/t.1/',author:'A',publishedAt:'2026-11-15T12:00:00Z',metrics:{replies:0}};
test('exact zero is a valid metric but rounded display is not exact',()=>{assert.equal(assessItem(item,now).status,'基础字段齐备');assert.equal(assessItem({...item,metrics:{viewsDisplay:'1K'}},now).status,'待核验线索')});
test('missing and expired publication remain leads',()=>{assert.equal(assessItem({...item,publishedAt:null},now).status,'待核验线索');assert.equal(assessItem({...item,publishedAt:'2020-01-01'},now).status,'待核验线索')});
test('conflicting first-post metadata cannot become field complete',()=>assert.equal(assessItem({...item,metadataConflict:true},now).status,'待核验线索'));
test('structure evidence only captures matching thread link',()=>{assert(metricStructure('<a href="/threads/t.1/">T</a>',item.url).targetMatched);assert(!metricStructure('<a href="/threads/t.2/">Other</a>',item.url).targetMatched)});
