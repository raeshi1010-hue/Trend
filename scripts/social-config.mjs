import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function configurationStatus(registry,env){
 const names=new Set();
 return registry.platforms.map(p=>{
  if(names.has(p.name))throw Error('Duplicate platform');names.add(p.name);
  if(!['planned','adapter','discovery','public'].includes(p.implementation))throw Error('Invalid implementation');
  const missing=p.requirements.filter(r=>!env[r.name]?.trim()||(r.equals&&env[r.name]!==r.equals)).map(r=>({name:r.name,kind:r.kind}));
  const status=p.implementation==='planned'?'采集方式待定／适配器未实现':p.implementation==='discovery'?'发现路径待完善':p.implementation==='public'?'公开采集已实测，仍需持续验证':missing.length?'适配器已实现，待授权配置':p.requirements.length?'配置项齐备，尚需真实接口验收':'公开适配器已实现，实际可用性见采样记录';
  return {...p,status,missing}; // Never serialize environment values.
 });
}
export async function generate(){
 const registry=JSON.parse(await fs.readFile(path.join(root,'config/social-platforms.json'),'utf8'));
 const platforms=configurationStatus(registry,process.env),out=path.join(root,'docs/social');
 await fs.mkdir(out,{recursive:true});
 await fs.writeFile(path.join(out,'configuration.json'),JSON.stringify({checkedAt:new Date().toISOString(),note:'本次进程可见配置；PR不注入Secrets，不代表仓库未保存Secrets。配置项存在不代表有效授权。',platforms},null,2));
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cards=platforms.map(p=>`<article><h2>${esc(p.name)}</h2><strong>${esc(p.status)}</strong><p>${esc(p.route)}</p><p>覆盖范围：${esc(p.coverage ? `授权账号：${p.coverage.authorized}；公开发现：${p.coverage.public}` : p.route)}</p><p>可取字段：${esc(p.fields)}</p><p>BGM：${esc(p.bgm)}</p><p>下一步：${esc(p.action)}</p><p>缺少本进程配置：${esc(p.missing.map(r=>r.kind+' '+r.name).join('；')||'无／当前阶段不索取凭据')}</p><a href="${esc(p.documentation)}" target="_blank" rel="noopener noreferrer">来源与文档</a></article>`).join('');
 await fs.writeFile(path.join(out,'configuration.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>全平台配置与授权</title><style>body{background:#edf3ee;color:#153c30;font:16px/1.7 system-ui;margin:auto;max-width:1200px;padding:24px}main{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}article{background:white;border:1px solid #cadbce;border-radius:14px;padding:24px;overflow-wrap:anywhere}a{color:#176b50}aside{padding:18px;background:#fff0ca;border-radius:10px;margin:20px 0}@media(max-width:700px){main{grid-template-columns:1fr}}</style><h1>全平台配置与授权</h1><a href="index.html">返回来源看板</a> · <a href="CURRENT-SETUP.md">当前配置步骤</a> · <a href="public-acceptance.json">公开路径实测</a> · <a href="configuration.json">下载配置状态</a><aside>配置梳理不等于全部平台已接通。这里检查本次进程可见配置，不验证令牌或审批；PR不会注入Secrets。未实现适配器的平台暂不索取令牌，避免提供无法使用的凭据。</aside><main>${cards}</main></html>`);
 console.log(platforms.map(p=>p.name+'：'+p.status).join('\n'));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await generate();
