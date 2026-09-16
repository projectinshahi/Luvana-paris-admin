import type { NextConfig } from "next";

// Where the API lives, as seen from the machine running THIS server. Server-only:
// it is read here at startup and never shipped to the browser.
const API_URL = process.env.API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // The browser calls /api/* on whatever host it loaded the panel from, and this
  // server forwards to the API. Previously NEXT_PUBLIC_API_URL=http://localhost:8000
  // was inlined into the client bundle, so any laptop other than the one running
  // the API called itself on port 8000 and every save and upload failed.
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/:path*` }];
  },

  experimental: {
    // Uploads travel browser → this server → API → Cloudinary. The 30 s dev
    // default is too tight for a 10 MB image on a slow connection.
    proxyTimeout: 120_000,
  },
};

export default nextConfig;
