/**
 * Vercel Function — Cloudinary signing.
 *
 * Deploys automatically from api/. The function URL is /api/cloudinary.
 */
import { handle } from '../functions/lib/handler.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    res.status(204).end();
    return;
  }

  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  try {
    // Vercel parses JSON bodies automatically, but falls back to a raw string
    // when the content type is missing or the body is not valid JSON.
    let body = {};
    if (typeof req.body === 'string' && req.body) {
      try {
        body = JSON.parse(req.body);
      } catch {
        body = {};
      }
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    }

    const headers = new Headers();
    if (req.headers.authorization) headers.set('Authorization', req.headers.authorization);
    if (req.headers['content-type']) headers.set('Content-Type', req.headers['content-type']);

    const request = new Request('https://function.local/api/cloudinary', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const response = await handle(request, process.env);
    const text = await response.text();

    res.status(response.status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Unexpected error' });
  }
}
