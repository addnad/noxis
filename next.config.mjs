/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep the heavy, Node-native 0G SDKs out of the serverless bundle so their
  // internals resolve at runtime instead of being statically traced.
  serverExternalPackages: [
    "@0glabs/0g-ts-sdk",
    "@0glabs/0g-serving-broker",
    "@0gfoundation/0g-compute-ts-sdk",
    "ethers",
  ],
};

export default nextConfig;
