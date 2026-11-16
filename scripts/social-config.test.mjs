import {test} from 'node:test';
import assert from 'node:assert/strict';
import {configurationStatus} from './social-config.mjs';
const r={platforms:[{name:'Test',implementation:'adapter',requirements:[{name:'KEY',kind:'secret'},{name:'APPROVED',kind:'variable',equals:'true'}]}]};
test('presence does not imply working credentials or leak values',()=>{
 const result=configurationStatus(r,{KEY:'sensitive-123',APPROVED:'true'});
 assert.equal(result[0].missing.length,0);assert.match(result[0].status,/尚需真实接口验收/);assert(!JSON.stringify(result).includes('sensitive-123'));
});
test('approval marker and missing secrets remain blocked',()=>{
 assert.equal(configurationStatus(r,{KEY:'k',APPROVED:'false'})[0].missing[0].name,'APPROVED');
 assert.equal(configurationStatus(r,{})[0].missing.length,2);
});
