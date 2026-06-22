/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: [
    "@0glabs/0g-ts-sdk",
    "@0glabs/0g-serving-broker",
    "@0gfoundation/0g-compute-ts-sdk",
    "@0gfoundation/0g-storage-ts-sdk",
    "ethers",
  ],
};

export default nextConfig;
