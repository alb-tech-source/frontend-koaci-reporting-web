import type { NextConfig } from "next";

const securityHeaders = [
  // Konsol admin tidak boleh dimuat di dalam iframe (clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

// Nilai NEXT_PUBLIC_* ditanam saat build; tanpa ini semua request API salah alamat
if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn(
    "⚠ NEXT_PUBLIC_API_BASE_URL belum diisi — aplikasi tidak akan bisa menghubungi backend.",
  );
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
