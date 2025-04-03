/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            // Basic redirect
            {
                source: '/',
                destination: '/chat',
                permanent: true,
            },
        ]
    },
    experimental: {
        taint: true,
    },
    output: 'standalone',
    images: {
        minimumCacheTTL: 31536000,
        formats: ["image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "assets.vercel.com",
                port: "",
                pathname: "/image/upload/**",
            },
            {
                protocol: "https",
                hostname: "images.unsplash.com",

            },
            {
                protocol: "https",
                hostname: "storage.googleapis.com"
            }
        ],
    },
};

module.exports = nextConfig