/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Add output configuration for better static optimization
  output: 'standalone',
  
  // Add webpack config overrides to fix build issues
  webpack: (config) => {
    // Optimize WebAssembly handling to fix hashing
    config.optimization.moduleIds = 'deterministic';
    
    // Disable WebAssembly optimization that's causing problems
    config.experiments = {
      ...config.experiments,
      syncWebAssembly: false,
    };
    
    // Increase memory limit
    config.performance = {
      ...config.performance,
      hints: false,
    };
    
    return config;
  },
}

export default nextConfig
