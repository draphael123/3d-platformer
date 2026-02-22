import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';

const ASSETS_BASE = '/Assets/';
const ASSETS_SOURCE = path.join(process.cwd(), 'Assets');

// Serve Assets folder at /Assets (dev) and copy into dist (build) so the pack works in production
function serveAssets() {
  return {
    name: 'serve-assets',
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { setHeader: (a: string, b: string) => void; end: () => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (!url.startsWith(ASSETS_BASE)) return next();
        const relative = url.slice(ASSETS_BASE.length).replace(/^\//, '');
        const filePath = path.join(ASSETS_SOURCE, relative);
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
    closeBundle() {
      const outDir = path.join(process.cwd(), 'dist');
      const dest = path.join(outDir, 'Assets');
      if (!fs.existsSync(ASSETS_SOURCE)) return;
      if (!fs.existsSync(outDir)) return;
      function copyRecursive(src: string, dst: string) {
        if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
        for (const name of fs.readdirSync(src)) {
          const srcPath = path.join(src, name);
          const dstPath = path.join(dst, name);
          if (fs.statSync(srcPath).isDirectory()) {
            copyRecursive(srcPath, dstPath);
          } else {
            fs.copyFileSync(srcPath, dstPath);
          }
        }
      }
      copyRecursive(ASSETS_SOURCE, dest);
      console.log('Copied Assets (Retro Medieval Kit) to dist/Assets');
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
  base: '/3d-platformer/', // GitHub Pages project site; use '/' for custom domain or Vercel
  plugins: [serveAssets()],
});
