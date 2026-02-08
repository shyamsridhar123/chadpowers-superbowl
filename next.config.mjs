/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.GITHUB_ACTIONS ? '/chadpowers-superbowl' : '',
  assetPrefix: process.env.GITHUB_ACTIONS ? '/chadpowers-superbowl/' : '',
  images: {
    unoptimized: true,
  },
}

export default nextConfig