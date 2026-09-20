import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cf.geekdo-images.com" },
      {
        protocol: "https",
        hostname: "luukpzapfixofyssyffp.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "luukpzapfixofyssyffp.supabase.co",
        pathname: "/storage/v1/object/sign/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
