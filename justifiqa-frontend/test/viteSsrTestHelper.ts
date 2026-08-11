import { createServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

export async function withViteModule<T>(
  modulePath: string,
  callback: (loaded: T) => Promise<void>,
): Promise<void> {
  const server = await createServer({
    configFile: resolve(projectRoot, 'vite.config.ts'),
    root: projectRoot,
    logLevel: 'silent',
    server: { middlewareMode: true },
  });
  try {
    const loaded = (await server.ssrLoadModule(modulePath)) as T;
    await callback(loaded);
  } finally {
    await server.close();
  }
}
