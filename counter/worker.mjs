export class PageCounter {
  constructor(ctx) { this.storage = ctx.storage; }
  async fetch() {
    const count = await this.storage.transaction(async tx => {
      const next = (await tx.get('views') || 0) + 1;
      await tx.put('views', next);
      return next;
    });
    return Response.json({ count }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGINS.split(',').map(x => x.trim());
    const headers = { 'Cache-Control': 'no-store', 'Vary': 'Origin' };
    if (!allowed.includes(origin)) return new Response('Forbidden', { status: 403, headers });
    headers['Access-Control-Allow-Origin'] = origin;
    if (new URL(request.url).pathname !== '/visits') return new Response('Not found', { status: 404, headers });
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'POST, OPTIONS' } });
    try {
      const id = env.COUNTER.idFromName('krishvaid.me-homepage-v1');
      const result = await env.COUNTER.get(id).fetch('https://counter.internal/');
      return new Response(result.body, { status: result.status, headers: { ...headers, 'Content-Type': 'application/json' } });
    } catch {
      return new Response('Counter unavailable', { status: 503, headers });
    }
  }
};
