import type { APIRoute } from 'astro';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const indexPath = join(process.cwd(), 'src/data/index.json');

export const GET: APIRoute = () => {
  const body = existsSync(indexPath) ? readFileSync(indexPath, 'utf-8') : '[]';
  return new Response(body, { headers: { 'Content-Type': 'application/json' } });
};
