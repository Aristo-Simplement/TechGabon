export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/verify"] },
    sitemap: "https://tech-gabon.vercel.app/sitemap.xml",
  };
}
