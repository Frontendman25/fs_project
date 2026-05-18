// import {NextConfig} from 'next';
// import createNextIntlPlugin from 'next-intl/plugin';

// const withNextIntl = createNextIntlPlugin({
//   experimental: {
//     createMessagesDeclaration: './messages/en.json'
//   }
// });

// const config: NextConfig = {};

// export default withNextIntl(config);

import { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'

function apiImageRemotePatterns(): NonNullable<
  NextConfig['images']
>['remotePatterns'] {
  const patterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
      port: '',
      pathname: '/**'
    }
  ]

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3100'
    const api = new URL(apiBase)
    const protocol = api.protocol.replace(':', '') as 'http' | 'https'
    patterns.push({
      protocol,
      hostname: api.hostname,
      port: api.port,
      pathname: '/api/files/**'
    })
  } catch {
    patterns.push({
      protocol: 'http',
      hostname: 'localhost',
      port: '3100',
      pathname: '/api/files/**'
    })
  }

  return patterns
}

const nextConfig: NextConfig = {
  // Produces a self-contained Node.js server in .next/standalone.
  // Required for the multi-stage Docker production image.
  output: 'standalone',
  turbopack: {
    root: path.join(__dirname)
  },
  images: {
    remotePatterns: apiImageRemotePatterns()
  }
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
