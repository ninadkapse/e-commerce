import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["http://10.16.131.137:3000"],
};

export default nextConfig;
