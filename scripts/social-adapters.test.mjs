import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseForum,enrichForum,youtube,reddit} from './social-adapters.mjs';
test('forum metadata uses thread interactions, never member reaction totals',()=>{
 const h='<div>Messages 10,000 Reaction score 300</div><script type="application/ld+json">'+JSON.stringify({'@type':'DiscussionForumPosting',author:{name:'builder'},datePublished:'2026-11-15T10:00:00Z',interactionStatistic:{interactionType:'https://schema.org/CommentAction',userInteractionCount:3}})+'</script>';
 assert.deepEqual(parseForum(h),{author:'builder',publishedAt:'2026-11-15T10:00:00.000Z',metrics:{comments:3},metadataSource:'DiscussionForumPosting JSON-LD'});
});
test('fallback reads first post time, not last activity or joining date',()=>{
 const p=parseForum('<time datetime="2026-11-16T00:00:00Z"></time><article data-author="Alice"><time datetime="2026-11-10T08:00:00Z"></time>Joined 2001 Reaction score 88</article>');
 assert.equal(p.publishedAt,'2026-11-10T08:00:00.000Z');assert.deepEqual(p.metrics,{});
});
test('failure never promotes RSS activity timestamp to first publication',async()=>{
 const p=await enrichForum({url:'https://www.diynot.com/diy/threads/test.1/',publishedAt:'2026-11-16'},async()=>({ok:false,status:403}));
 assert.equal(p.publishedAt,null);assert.equal(p.rssDate,'2026-11-16');
});
test('missing credentials and approval make zero API requests',async()=>{
 const no=()=>{throw Error('Must not request')};
 assert.equal((await youtube({},no)).items.length,0);assert.equal((await reddit({},no)).items.length,0);
 assert.equal((await reddit({REDDIT_ACCESS_TOKEN:'token'},no)).items.length,0);
});
test('YouTube combines search IDs with detail statistics without inferring market or music',async()=>{
 let calls=0;const request=async()=>({ok:true,json:async()=>++calls===1?{items:[{id:{videoId:'abcdefghijk'}}]}:{items:[{id:'abcdefghijk',snippet:{title:'Original title',channelTitle:'A',publishedAt:'2026-11-15T10:00:00Z',tags:['concrete']},statistics:{viewCount:'12',likeCount:'2'}}]}});
 const r=await youtube({YOUTUBE_API_KEY:'test'},request);assert.equal(calls,2);assert.equal(r.items[0].metrics.viewCount,12);assert.equal(r.items[0].market,'市场未确认');assert.equal(r.items[0].bgm,null);
});
test('credential-bearing error messages never reach output',async()=>{
 const r=await youtube({YOUTUBE_API_KEY:'secret-test'},async()=>{throw Error('https://google.test/?key=secret-test')});assert(!JSON.stringify(r).includes('secret-test'));
});
test('Reddit uses bearer header and preserves score as score',async()=>{
 const r=await reddit({REDDIT_API_APPROVED:'true',REDDIT_ACCESS_TOKEN:'test',REDDIT_USER_AGENT:'test-app'},async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer test');return {ok:true,json:async()=>({data:{children:[{data:{title:'T',permalink:'/r/Construction/comments/id/t/',author:'a',created_utc:1794708000,score:5,num_comments:2,upvote_ratio:0.8}}]}})}});
 assert.equal(r.items[0].metrics.score,5);assert.equal(r.items[0].market,'市场未确认');
});
