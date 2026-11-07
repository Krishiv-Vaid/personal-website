import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { PageCounter } from '../counter/worker.mjs';
function setup() {
  const values = new Map(); let queue = Promise.resolve();
  const storage = { transaction(fn) { const result = queue.then(() => fn({ get: async k => values.get(k), put: async (k,v) => values.set(k,v) })); queue = result.catch(() => {}); return result; } };
  let object = new PageCounter({ storage });
  return { env: { ALLOWED_ORIGINS: 'https://krishvaid.me', COUNTER: { idFromName: x => x, get: () => object } }, restart: () => { object = new PageCounter({ storage }); } };
}
const req = (method='POST',origin='https://krishvaid.me',path='/visits') => new Request('https://example.workers.dev'+path, { method, headers: { Origin: origin } });
test('concurrent increments are unique and survive object recreation', async () => {
  const { env, restart } = setup();
  const results = await Promise.all(Array.from({length:100},async () => (await (await worker.fetch(req(),env)).json()).count));
  assert.equal(new Set(results).size,100); assert.equal(Math.max(...results),100);
  restart(); assert.equal((await (await worker.fetch(req(),env)).json()).count,101);
});
test('GET, preflight, wrong paths and disallowed origins never increment',async () => {
  const {env}=setup();
  for (const [request,status] of [[req('GET'),405],[req('OPTIONS'),204],[req('POST','https://evil.example'),403],[req('POST','https://krishvaid.me','/'),404]]) assert.equal((await worker.fetch(request,env)).status,status);
  const response=await worker.fetch(req(),env);
  assert.equal(response.headers.get('Cache-Control'),'no-store');
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),'https://krishvaid.me');
  assert.equal((await response.json()).count,1);
});
test('storage failure returns a non-cacheable error',async () => {
  const {env}=setup(); env.COUNTER.get=()=>{throw new Error('offline');};
  const response=await worker.fetch(req(),env); assert.equal(response.status,503); assert.equal(response.headers.get('Cache-Control'),'no-store');
});
