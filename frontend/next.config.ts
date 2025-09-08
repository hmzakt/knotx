// import type { NextConfig } from "next";

// const isDev = process.env.NODE_ENV !== "production";

// const nextConfig: NextConfig = {
//   async headers() {
//     return [
//       {
//         source: "/(.*)",
//         headers: [
//           { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
//           { key: "X-Content-Type-Options", value: "nosniff" },
//           { key: "X-Frame-Options", value: "SAMEORIGIN" },
//           { key: "Referrer-Policy", value: "no-referrer" },
//           { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
//           {
//             key: "Content-Security-Policy",
//             value: [
//               "default-src 'self'",
//               "base-uri 'self'",
//               "frame-ancestors 'self'",
//               "img-src 'self' data: https:",
//               "style-src 'self' 'unsafe-inline' https:",
//               `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval' " : ""}https:`,
//               `connect-src 'self' https: wss:${isDev ? " ws: http:" : ""}`,
//               "upgrade-insecure-requests",
//             ].join("; "),
//           },
//         ],
//       },
//     ];
//   },
// };

// export default nextConfig;
