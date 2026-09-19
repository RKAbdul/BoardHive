import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Avatar/single-photo uploads are capped at 5MB (features/profile and
      // features/plays actions), but logging a play can attach up to
      // MAX_PHOTOS_PER_PLAY (6) photos in the same multipart submission —
      // theoretical worst case ~30MB. Sized with headroom over that so our
      // own per-file message is what users see, not the framework's cutoff.
      bodySizeLimit: "36mb",
    },
  },
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
