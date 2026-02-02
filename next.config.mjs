/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    swcMinify: true,
    experimental: {
        esmExternals: false
    }
};

export default nextConfig;
