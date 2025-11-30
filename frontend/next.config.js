/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['ethers', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
    // Turbopack configuration (used when running with --turbo)
    turbo: {
      resolveAlias: {
        // Node.js module fallbacks for browser (same as webpack config)
        fs: { browser: '' },
        net: { browser: '' },
        tls: { browser: '' },
        crypto: { browser: '' },
        stream: { browser: '' },
        url: { browser: '' },
        zlib: { browser: '' },
        http: { browser: '' },
        https: { browser: '' },
        assert: { browser: '' },
        os: { browser: '' },
        path: { browser: '' },
      },
    },
  },
  
  // Webpack config for ethers.js compatibility (used in production builds)
  webpack: (config, { dev, isServer }) => {
    // Fallbacks for Node.js modules not available in browser
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    return config;
  },
}

module.exports = nextConfig
