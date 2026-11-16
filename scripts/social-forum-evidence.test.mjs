import {test} from 'node:test';
import assert from 'node:assert/strict';
import {threadStatistics,forumCategory,locationEvidence} from './social-forum-evidence.mjs';
const ld=x=>'<script type="application/ld+json">'+JSON.stringify(x)+'</script>';
test('nested linked data metrics match the actual thread, not a suggested post',()=>{
 const html=ld({'@type':'WebPage',mainEntity:{'@type':'DiscussionForumPosting',url:'https://f.test/threads/t.1/',commentCount:5},related:{'@type':'DiscussionForumPosting',url:'https://f.test/threads/other.2/',commentCount:999}});
 assert.deepEqual(threadStatistics(html,'https://f.test/threads/t.1/'),{replies:5});
});
test('profile totals are never thread metrics',()=>assert.deepEqual(threadStatistics('<p>Messages 888 Reaction score 999</p>','https://f.test/threads/t.1/'),{}));
test('category follows only same-site schema breadcrumbs',()=>{
 const html=ld({'@type':'BreadcrumbList',itemListElement:[{item:'https://evil.test/forums/general.4/'},{item:'https://f.test/forums/building.3/'}]});
 assert.equal(forumCategory(html,'https://f.test/threads/t.1/'),'https://f.test/forums/building.3/');
});
test('project title does not establish audience market or independent verification',()=>{
 const result=locationEvidence('Dubai Waterfront','<div>Author location UAE</div>','https://f.test/threads/t.1/');
 assert.equal(result.status,'仅标题提及，待核验');assert.equal(result.audienceMarket,'未确认');
});
test('project country evidence is limited to breadcrumbs',()=>{
 const html=ld({'@type':'BreadcrumbList',itemListElement:[{name:'United Kingdom',item:'https://f.test/forums/uk.1/'}]});
 const result=locationEvidence('MANCHESTER | Tower',html,'https://f.test/threads/t.1/');assert.equal(result.status,'原帖标题与来源分区支持');assert.equal(result.audienceMarket,'未确认');
});
test('DOM breadcrumb supports category and project geography without reading profile locations',()=>{
 const html='<div>Author location France</div><ul class="p-breadcrumbs"><li><a href="/forums/uk.7/">United Kingdom</a></li></ul>';
 assert.equal(forumCategory(html,'https://f.test/threads/t.1/'),'https://f.test/forums/uk.7/');
 assert.equal(locationEvidence('Manchester tower',html,'https://f.test/threads/t.1/').status,'原帖标题与来源分区支持');
});
