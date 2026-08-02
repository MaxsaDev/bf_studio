import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/success-payment"],
    },
    sitemap: "https://bodyfactory.studio/sitemap.xml",
  };
}
