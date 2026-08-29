import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  images: {
    // Las fotos viven en el bucket público de Supabase.
    remotePatterns: supabase
      ? [{ protocol: "https", hostname: new URL(supabase).hostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
