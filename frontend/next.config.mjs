/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Keep trailing slashes on /api/v1/... so Django POST (APPEND_SLASH) works via rewrites
  skipTrailingSlashRedirect: true,
  async rewrites() {
    const api =
      process.env.API_INTERNAL_URL || "http://127.0.0.1:8000";
    return [
      {
        source: "/api/v1/:path*",
        destination: `${api}/api/v1/:path*`,
      },
      {
        source: "/api/docs",
        destination: `${api}/api/docs`,
      },
      {
        source: "/api/schema/",
        destination: `${api}/api/schema/`,
      },
    ];
  },
};

export default nextConfig;
