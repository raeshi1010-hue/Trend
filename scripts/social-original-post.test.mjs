import {test} from 'node:test';
import assert from 'node:assert/strict';
import {originalPost} from './social-original-post.mjs';
test('first visible reply is never silently promoted to original post',()=>{
 const r=originalPost('<article data-author="Reply"><time datetime="2026-11-15T00:00:00Z"></time><a href="#post-2">#2</a></article>');
 assert.equal(r.author,null);assert.equal(r.firstPostConfirmed,false);
});
test('explicit post 1 can follow a visible reply in HTML order',()=>{
 const r=originalPost('<article data-author="Reply"><time datetime="2026-11-15T00:00:00Z"></time><a>#2</a></article><article data-author="Starter"><header class="message-attribution"><time datetime="2026-11-14T00:00:00Z"></time><a>#1</a></header></article>');
 assert.equal(r.author,'Starter');assert.equal(r.publishedAt,'2026-11-14T00:00:00.000Z');
});
test('thread starter header is authoritative over arbitrary first article',()=>{
 const r=originalPost('<div class="p-description"><span>Thread starter</span><a class="username">Starter</a><span>Start date</span><time datetime="2026-11-13T16:22:16-0500"></time></div><article data-author="Reply"><time datetime="2026-11-15T00:00:00Z"></time></article>');
 assert.equal(r.author,'Starter');assert.equal(r.publishedAt,'2026-11-13T21:22:16.000Z');
});
