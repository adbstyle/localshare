// Loaded before every test file (jest setupFiles), i.e. before AppModule is
// imported. Values set here win over apps/backend/.env because neither dotenv
// nor @nestjs/config overrides variables that already exist.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://localshare:changeme_in_production@localhost:5433/localshare_test';

Object.assign(process.env, {
  DATABASE_URL: TEST_DATABASE_URL,
  DIRECT_URL: TEST_DATABASE_URL,
  JWT_SECRET: 'integration-test-secret',
  FRONTEND_URL: 'http://localhost:3000',
  STORAGE_PROVIDER: 'local',
  GOOGLE_CLIENT_ID: 'test',
  GOOGLE_CLIENT_SECRET: 'test',
  GOOGLE_CALLBACK_URL: 'http://localhost:3001/api/v1/auth/google/callback',
  MICROSOFT_CLIENT_ID: 'test',
  MICROSOFT_CLIENT_SECRET: 'test',
  MICROSOFT_CALLBACK_URL: 'http://localhost:3001/api/v1/auth/microsoft/callback',
});
