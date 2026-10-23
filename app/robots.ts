import type { MetadataRoute } from "next";

const site = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000";

// private and signed-in pages stay out of search (they are also behind sign-in and RLS)
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/me", "/admin", "/submit", "/auth"] },
    sitemap: `${site}/sitemap.xml`,
  };
}
