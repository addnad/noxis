/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The 0G SDKs are heavy, Node-native packages. Keep them external to the
  // serverless bundle so their internal `fs`/native deps resolve at runtime
  // instead of being statically traced/bundled by Turbopack/webpack.
  serverExternalPackages: [
    "@0glabs/0g-ts-sdk",
    "@0glabs/0g-serving-broker",
    "@0gfoundation/0g-compute-ts-sdk",
    "ethers",
  ],
};

export default nextConfig;
