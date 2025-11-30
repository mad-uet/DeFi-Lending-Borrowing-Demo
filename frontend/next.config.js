/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['ethers', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
  },
  
  // Turbopack configuration (used when running with --turbo)
  turbo: {
    resolveAlias: {
      // Add any aliases needed for Turbopack
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
