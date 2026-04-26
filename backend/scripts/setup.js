#!/usr/bin/env node

/**
 * Setup Script for Backend Application
 * Helps with initial database setup and configuration
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up backend application...\n')

// Check if .env file exists
const envPath = path.join(__dirname, '..', '.env')

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...')

  const envExample = `# PostgreSQL Configuration
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=fs_project
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password

# Database Type (postgresql or mongodb)
DATABASE_TYPE=postgresql

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REFRESH_TOKEN_SECRET=your-super-secret-refresh-token-key-change-in-production

# Server Configuration
PORT=3100
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Cloudinary Configuration (optional)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret`

  fs.writeFileSync(envPath, envExample)
  console.log('✅ .env file created. Please update the values with your actual configuration.')
}

// Check database type from .env
const envContent = fs.readFileSync(envPath, 'utf8')
const databaseType = envContent.match(/DATABASE_TYPE=(.+)/)?.[1]?.trim()

console.log(`🗄️  Database type: ${databaseType || 'postgresql (default)'}`)

if (databaseType === 'postgresql' || !databaseType) {
  console.log('\n📊 Setting up PostgreSQL database...')

  try {
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })

    // Push schema to database
    console.log('📋 Pushing schema to database...')
    execSync('npx prisma db push', { stdio: 'inherit' })

    console.log('✅ PostgreSQL setup completed!')
  } catch (error) {
    console.error('❌ PostgreSQL setup failed:', error.message)
    console.log('\n💡 Make sure:')
    console.log('   1. PostgreSQL is installed and running')
    console.log('   2. Database "fs_project" exists')
    console.log('   3. Connection credentials in .env are correct')
    process.exit(1)
  }
} else if (databaseType === 'mongodb') {
  console.log('\n🍃 MongoDB setup...')
  console.log('✅ MongoDB setup completed! (No migrations needed)')
} else {
  console.log(`❌ Unknown database type: ${databaseType}`)
  process.exit(1)
}

console.log('\n🎉 Setup completed successfully!')
console.log('\n📋 Next steps:')
console.log('   1. Update .env file with your actual configuration')
console.log('   2. Run: npm run dev')
console.log('   3. Visit: http://localhost:3100')
console.log('\n📚 For more information, see README.md')

