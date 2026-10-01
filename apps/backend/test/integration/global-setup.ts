import { execSync } from 'child_process';
import { TEST_DATABASE_URL } from './env';

// Rebuilds the test database from the migrations once per run. Refuses to run
// against anything but a local *_test database so a stray env var can never
// wipe a shared database.
export default function globalSetup(): void {
  const url = new URL(TEST_DATABASE_URL);
  const isLocalHost = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (!isLocalHost || !url.pathname.endsWith('_test')) {
    throw new Error(`Refusing to reset non-test database ${url.host}${url.pathname}`);
  }

  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL, DIRECT_URL: TEST_DATABASE_URL },
  });
}
