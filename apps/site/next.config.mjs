/** @type {import('next').NextConfig} */
import path from 'path';

const nextConfig = {
  transpilePackages: ["@resume-agent/contracts", "@resume-agent/profile", "@resume-agent/widget"],
  sassOptions: {
    includePaths: [path.join(process.cwd(), 'src/styles')]
  }
};

export default nextConfig;
