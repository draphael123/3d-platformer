import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const ASSETS_BASE = '/Assets/';

// Serve Assets folder at /Assets so Retro Medieval Kit can be loaded by URL
function serveAssets() {
  return {
    name: 'serve-assets',
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { setHeader: (a: string, b: string) => void; end: () => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith(ASSETS_BASE)) return next();
        const relative = url.slice(ASSETS_BASE.length).replace(/^\//, '');
        const filePath = path.join(process.cwd(), 'Assets', relative);
        if (!fs.existsSync(filePath)) return next();
        const stat = fs.statSync(filePath);
        if (!stat.isFile()) return next();
        res.setHeader('Content-Type', getMime(filePath));
        const stream = fs.createReadStream(filePath);
        stream.on('error', next);
        stream.pipe(res as NodeJS.WritableStream);
        return;
      });
    },
  };
}

function getMime(p: string): string {
  if (p.endsWith('.obj')) return 'text/plain';
  if (p.endsWith('.mtl')) return 'text/plain';
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.jpg') || p.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [serveAssets()],
});
