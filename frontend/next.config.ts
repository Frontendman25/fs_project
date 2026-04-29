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

const nextConfig: NextConfig = {
  // Produces a self-contained Node.js server in .next/standalone.
  // Required for the multi-stage Docker production image.
  output: 'standalone',
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
