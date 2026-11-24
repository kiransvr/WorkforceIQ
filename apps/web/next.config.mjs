/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];

    const apiOrigin = new URL(target);
    if (!["http:", "https:"].includes(apiOrigin.protocol)) {
      throw new Error("API_PROXY_TARGET must use HTTP or HTTPS.");
    }
    if (
      apiOrigin.username ||
      apiOrigin.password ||
      apiOrigin.pathname !== "/" ||
      apiOrigin.search ||
      apiOrigin.hash
    ) {
      throw new Error("API_PROXY_TARGET must be an origin without credentials or a path.");
    }
    if (process.env.NODE_ENV === "production" && apiOrigin.protocol !== "https:") {
      throw new Error("API_PROXY_TARGET must use HTTPS in production.");
    }

    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin.origin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
