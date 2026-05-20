/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

module.exports = nextConfig
import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
