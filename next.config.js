/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@nivo'],
  webpack: (config) => {
    return {
      ...config,
      resolve: {
        ...config.resolve,
        fallback: {
          ...config.resolve.fallback,
          'd3': require.resolve('d3'),
          'd3-scale-chromatic': require.resolve('d3-scale-chromatic'),
        },
      },
    }
  }
}

module.exports = nextConfig
