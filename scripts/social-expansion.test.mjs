import {test} from 'node:test';
import assert from 'node:assert/strict';
import {xSearch,discoverThreads,classify} from './social-expansion.mjs';
test('X requires explicit enablement and token before sending any request',async()=>{
 const no=()=>{throw Error('must not request')};assert.equal((await xSearch({X_BEARER_TOKEN:'t'},no)).items.length,0);assert.equal((await xSearch({X_API_ENABLED:'true'},no)).items.length,0);
});
test('X sample expands author without inferring market or music',async()=>{
 const r=await xSearch({X_API_ENABLED:'true',X_BEARER_TOKEN:'secret'},async(url,o)=>{assert.equal(o.headers.Authorization,'Bearer secret');return {ok:true,json:async()=>({data:[{id:'123',text:'Concrete',author_id:'7',public_metrics:{like_count:5},entities:{hashtags:[{tag:'Concrete'}]}}],includes:{users:[{id:'7',username:'builder'}]}})}});
 assert.equal(r.items[0].author,'builder');assert.equal(r.items[0].market,'市场未确认');assert.equal(r.items[0].bgm,null);
});
test('thread discovery rejects offsite and normalizes duplicates',()=>{
 const r=discoverThreads('<a href="https://evil.test/threads/t.1/">evil</a><a href="/threads/t.1/?x=1">Title</a><a href="/threads/t.1/">duplicate</a><a href="javascript:alert(1)">bad</a>','https://www.contractortalk.com/forums/');assert.equal(r.length,1);assert.equal(r[0].url,'https://www.contractortalk.com/threads/t.1/');
});
test('classification remains conservative for unknown title',()=>{assert.equal(classify('Unknown topic'),'待分类');assert.equal(classify('Wall waterproofing'),'工程与使用端');});
test('forum discovery rejects timestamp anchors and community rules',()=>{
 const r=discoverThreads('<a href="/threads/rules.1/">community rules</a><a href="/threads/job.2/">4h ago</a><a href="/threads/job.2/">Concrete job</a>','https://www.contractortalk.com/forums/');assert.equal(r.length,1);assert.equal(r[0].title,'Concrete job');
});
