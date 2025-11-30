/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Experimental features for better performance
  experimental: {
    // Optimize package imports
    optimizePackageImports: ['ethers', '@radix-ui/react-dialog', '@radix-ui/react-tabs'],
  },
  
  // Webpack config for ethers.js compatibility
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
    
    // Optimize chunking in development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            ethers: {
              test: /[\\/]node_modules[\\/]ethers[\\/]/,
              name: 'ethers',
              chunks: 'all',
              priority: 10,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Reduce build output verbosity
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
}

module.exports = nextConfig
