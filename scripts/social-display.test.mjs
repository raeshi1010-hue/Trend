import test from 'node:test';
import assert from 'node:assert/strict';
import {beijingTime,mentionedPlaces} from './social-display.mjs';
test('Shanghai display converts UTC and does not invent missing dates',()=>{
 assert.match(beijingTime('2026-11-16T06:12:46Z'),/14:12/);
 assert.equal(beijingTime(null),'未取得');
});
test('explicit country mentions preserve evidence without inferring audience',()=>{
 assert.deepEqual(mentionedPlaces('India to Saudi Arabia').map(p=>p.country),['沙特','印度']);
 assert.deepEqual(mentionedPlaces('English construction vlog #USinteriordesign'),[]);
});
