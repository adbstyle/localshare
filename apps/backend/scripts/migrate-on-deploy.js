// Vercel build step: apply pending Prisma migrations only when the target
// environment opts in via PRISMA_MIGRATE_ON_DEPLOY=true (set for production
// and the develop-branch preview once their Supabase DB holds the restored
// data). Branch names alone are not safe: CLI deploys report the local branch.
const { execSync } = require('child_process');

if (process.env.PRISMA_MIGRATE_ON_DEPLOY === 'true') {
  console.log('migrate-on-deploy: running prisma migrate deploy');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
} else {
  console.log('migrate-on-deploy: skipped (PRISMA_MIGRATE_ON_DEPLOY not set)');
}
