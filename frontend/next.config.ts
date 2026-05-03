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

const nextConfig: NextConfig = {
  // Produces a self-contained Node.js server in .next/standalone.
  // Required for the multi-stage Docker production image.
  output: 'standalone',
  turbopack: {
    root: path.join(__dirname)
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**'
      }
    ]
  }
}

const withNextIntl = createNextIntlPlugin()
export default withNextIntl(nextConfig)
