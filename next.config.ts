import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
  * Uncomment when using Webpack
  webpack: (config) => {
    // See https://webpack.js.org/configuration/resolve/#resolvealias
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
    },
  */
  experimental: {
    turbo: {
      resolveAlias: {
        sharp$: "./turbo-patches/empty.js",
        "onnxruntime-node$": "./turbo-patches/empty.js",
      },
    },
    serverComponentsExternalPackages: ["sharp", "onnxruntime-node"],
  },
  serverExternalPackages: ["sharp", "onnxruntime-node"], // When using turbopack, this is required to avoid errors with onnxruntime-node
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "*",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
