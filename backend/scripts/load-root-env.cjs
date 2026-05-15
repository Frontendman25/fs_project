/**
 * Loads monorepo root .env (then backend/.env) and runs a Prisma CLI command.
 * Usage: node scripts/load-root-env.cjs prisma studio
 */
const path = require('path')
const { spawnSync } = require('child_process')

require('dotenv').config({
  path: path.join(__dirname, '../../.env')
})
require('dotenv').config({
  path: path.join(__dirname, '../.env')
})

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/load-root-env.cjs <prisma-args...>')
  process.exit(1)
}

const result = spawnSync('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: path.join(__dirname, '..')
})

process.exit(result.status ?? 1)
