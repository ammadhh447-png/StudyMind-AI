import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** Avoid aggressive link prefetch while a route is still compiling (reduces dev "Failed to fetch"). */
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
    ],
  },
  devIndicators: {
    appIsrStatus: false,
  },
};

export default nextConfig;
