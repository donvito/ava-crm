/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Feature frontend components live outside apps/web (in features/*/frontend).
    externalDir: true,
  },
};

export default nextConfig;
