import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../js/main.js',import.meta.url),'utf8');
function run({endpoint='https://counter.example/visits',prerendering=false,blockedStorage=false}={}) {
  let requests=[]; const events={}; const clicks={};
  const toggle={setAttribute(k,v){this[k]=v;},getAttribute(k){return this[k];},addEventListener(k,fn){clicks[k]=fn;}};
  const dialog={querySelector:()=>({addEventListener(){}}),addEventListener(){}};
  const counter={dataset:{counter:endpoint}}; const root={dataset:{theme:'light'}};
  const document={documentElement:root,prerendering,querySelector:s=>s==='#theme-toggle'?toggle:s==='#lightbox'?dialog:s==='[data-counter]'?counter:{},querySelectorAll:()=>[],addEventListener:(k,f)=>events[k]=f};
  const window={}; const localStorage={getItem(){if(blockedStorage)throw Error();return null;},setItem(){if(blockedStorage)throw Error();}};
  const context=vm.createContext({document,window,localStorage,matchMedia:()=>({matches:false,addEventListener(){}}),fetch:async(...args)=>{requests.push(args);return {ok:true,json:async()=>({count:42})};},AbortSignal,Date,Number});
  vm.runInContext(source,context);
  return {requests,events,counter,root,clicks,again:()=>vm.runInContext(source,context)};
}
test('one intentional POST even if initialized twice; refresh gets a new request',async()=>{
  const first=run();first.again();assert.equal(first.requests.length,1);
  assert.equal(first.requests[0][1].method,'POST'); assert.equal(first.requests[0][1].cache,'no-store');
  const refreshed=run();assert.equal(refreshed.requests.length,1);
  await new Promise(resolve=>setImmediate(resolve));assert.equal(first.counter.textContent,'42 visits');
});
test('unconfigured counter sends no requests',()=>assert.equal(run({endpoint:''}).requests.length,0));
test('prerender waits for activation',()=>{const result=run({prerendering:true});assert.equal(result.requests.length,0);result.events.prerenderingchange();assert.equal(result.requests.length,1);});
test('theme toggle works when storage is blocked',()=>{const result=run({blockedStorage:true});result.clicks.click();assert.equal(result.root.dataset.theme,'dark');result.clicks.click();assert.equal(result.root.dataset.theme,'light');});
