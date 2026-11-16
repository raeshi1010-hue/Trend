import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicText,failureKind} from './social-public-http.mjs';
import {stableForumSource} from './social-expansion.mjs';
const noPause=async()=>{};
test('temporary server failure is retried once and attempts preserved',async()=>{
 let count=0;const r=await publicText('https://example.test',{pause:noPause,request:async()=>++count===1?{ok:false,status:503}:{ok:true,status:200,text:async()=>'ok'}});
 assert(r.ok);assert.equal(r.attempts.length,2);assert.equal(r.attempts[0].kind,'temporary_server_error');
});
test('access blocks and rate limits are not retried',async()=>{
 for(const status of [401,403,429,451]){let count=0;const r=await publicText('https://example.test',{pause:noPause,request:async()=>{count++;return {ok:false,status}}});assert.equal(count,1);assert(!r.ok);}
});
test('TLS errors do not trigger retries or insecure fallback',async()=>{
 let count=0;const r=await publicText('https://example.test',{pause:noPause,request:async(u,o)=>{count++;assert.equal(o.redirect,'error');throw Object.assign(Error('private diagnostic'),{cause:{code:'UNABLE_TO_VERIFY_LEAF_SIGNATURE'}})}});assert.equal(count,1);assert.equal(r.kind,'certificate_error');assert(!JSON.stringify(r).includes('private diagnostic'));
});
test('timeout retries are bounded at two attempts',async()=>{
 let count=0;const r=await publicText('https://example.test',{pause:noPause,request:async()=>{count++;throw Object.assign(Error(),{name:'TimeoutError'})}});assert.equal(count,2);assert.equal(r.attempts.length,2);
});
test('forum alternate path is not used to bypass access restrictions',async()=>{
 let count=0;const r=await stableForumSource({url:'https://example.test/forums/',name:'test'},{pause:noPause,request:async()=>{count++;return {ok:false,status:403}}});assert.equal(count,1);assert.equal(r.items.length,0);
});
test('empty primary page tries same-site alternate and records both paths',async()=>{
 const seen=[];const r=await stableForumSource({url:'https://example.test/forums/',name:'test'},{pause:noPause,request:async u=>{seen.push(u);return {ok:true,status:200,text:async()=>'<html>No threads</html>'}}});assert.deepEqual(seen,['https://example.test/forums/','https://example.test/']);assert.equal(r.accessAttempts.length,2);
});
