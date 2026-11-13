/**
 * Netlify Function — Cloudinary signing.
 *
 * Deploys automatically from netlify/functions/. The site function URL is
 * /.netlify/functions/cloudinary.
 */
import { handle } from '../../functions/lib/handler.js';

export default async (request) => {
  try {
    return await handle(request, process.env);
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Unexpected error' }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } }
    );
  }
};
