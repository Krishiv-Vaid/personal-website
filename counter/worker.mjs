// Visitor counter for krishvaid.me: one Durable Object holds the count, so
// increments are atomic and the answer comes back in ~50 ms.
import { DurableObject } from 'cloudflare:workers';

export class PageCounter extends DurableObject {
  async hit(start) {
    // Durable Object input gates keep this get+put from interleaving with other requests.
    const next = ((await this.ctx.storage.get('views')) ?? start) + 1;
    await this.ctx.storage.put('views', next);
    return next;
  }
}

const PROD = new Set(['https://krishvaid.me', 'https://www.krishvaid.me', 'http://krishvaid.me', 'http://www.krishvaid.me']);
const isLocal = o => /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(o || '');

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = { 'Cache-Control': 'no-store', Vary: 'Origin' };
    if (!PROD.has(origin) && !isLocal(origin)) return new Response('Forbidden', { status: 403, headers });
    headers['Access-Control-Allow-Origin'] = origin;

    if (new URL(request.url).pathname !== '/visits') return new Response('Not found', { status: 404, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST' } });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers });

    // Local testing counts separately so it never inflates the real number.
    const name = isLocal(origin) ? 'dev' : 'krishvaid.me';
    const counter = env.COUNTER.get(env.COUNTER.idFromName(name));
    const count = await counter.hit(name === 'dev' ? 0 : Number(env.START_COUNT || 0));
    return Response.json({ count }, { headers });
  },
};
