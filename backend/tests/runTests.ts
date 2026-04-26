import { RepositoryConfigValidator } from '../src/infrastructure/repositories/repository-config.validator'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error('FAIL:', message)
    process.exitCode = 1
  } else {
    console.log('PASS:', message)
  }
}

async function run() {
  console.log('Running lightweight backend tests...')

  // Preserve originals
  const origEnv = { ...process.env }

  try {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'legacy-runner-jwt'
    process.env.REFRESH_TOKEN_SECRET = 'legacy-runner-refresh'

    // Test 1: Default (no DATABASE_TYPE) -> postgresql; needs a URL
    delete process.env.DATABASE_TYPE
    delete process.env.DATABASE_URL
    delete process.env.POSTGRESQL_URL
    delete process.env.MONGODB_URI
    const res1 = RepositoryConfigValidator.validateEnvironment()
    assert(
      res1.databaseType === 'postgresql',
      'default databaseType should be postgresql'
    )
    assert(
      res1.errors.length > 0,
      'default postgresql without URL should produce errors'
    )

    // Test 2: PostgreSQL without any URL -> error
    process.env.DATABASE_TYPE = 'postgresql'
    delete process.env.DATABASE_URL
    delete process.env.POSTGRESQL_URL
    const res2 = RepositoryConfigValidator.validateEnvironment()
    assert(
      res2.errors.length > 0,
      'postgresql without DATABASE_URL or POSTGRESQL_URL should produce errors'
    )

    // Test 3: PostgreSQL with DATABASE_URL -> valid
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db'
    const res3 = RepositoryConfigValidator.validateEnvironment()
    assert(res3.isValid, 'postgresql with DATABASE_URL should be valid')

    console.log('\nSummary:\n', RepositoryConfigValidator.getConfigSummary())

    if (process.exitCode === 1) {
      console.error('\nOne or more tests failed')
      process.exit(1)
    } else {
      console.log('\nAll lightweight tests passed')
      process.exit(0)
    }
  } finally {
    // restore env
    process.env = origEnv
  }
}

run().catch((err) => {
  console.error('Test runner error:', err)
  process.exit(2)
})
