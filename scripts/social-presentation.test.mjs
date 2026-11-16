import {test} from 'node:test';
import assert from 'node:assert/strict';
import {displayMetrics,displayTitle,presentDashboard} from './social-presentation.mjs';
test('metrics show zero and missing values differently',()=>{assert.equal(displayMetrics({replies:0,views:149}),'回复 0 · 浏览 149');assert.equal(displayMetrics({}),'互动指标未取得')});
test('original title entity is decoded only for display',()=>assert.equal(displayTitle('T&amp;M &#38; tools'),'T&M & tools'));
test('display title remains escaped and does not create executable markup',()=>{
 const item={title:'&lt;img src=x onerror=alert(1)&gt;',metrics:{},market:'市场未确认'};
 const h=presentDashboard('<h3>&amp;lt;img src=x onerror=alert(1)&amp;gt;</h3>',[{items:[item]}]);assert(!h.includes('<img'));assert(h.includes('&lt;img'));
});
