import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

let viteServer: Awaited<ReturnType<typeof createServer>> | null = null;

export async function getViteServer(): Promise<Awaited<ReturnType<typeof createServer>>> {
  if (!viteServer) {
    viteServer = await createServer({
      configFile: resolve(projectRoot, 'vite.config.ts'),
      root: projectRoot,
      logLevel: 'silent',
      server: { middlewareMode: true },
    });
  }
  return viteServer;
}

export async function loadComponent<T>(modulePath: string): Promise<T> {
  const server = await getViteServer();
  // modulePath should be absolute from project root, e.g., '/src/components/...'
  const mod = await server.ssrLoadModule(modulePath);
  return mod as T;
}

export async function closeViteServer(): Promise<void> {
  if (viteServer) {
    await viteServer.close();
    viteServer = null;
  }
}