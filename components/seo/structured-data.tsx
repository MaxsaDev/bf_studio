import { certificates } from "@/data/certificates";
import { resolvePrice, applyDiscount } from "@/lib/pricing";
import { siteConfig } from "@/lib/site-config";

const SITE_URL = "https://bodyfactory.studio";

/**
 * JSON-LD Product/Offer markup for every certificate — enables
 * rich results (price snippets) in search. Server component.
 */
export function StructuredData() {
  const products = certificates.map((certificate) => {
    const resolved = resolvePrice(certificate, null);

    const offers =
      certificate.type === "massage_course"
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "UAH",
            lowPrice: Math.min(
              ...certificate.variants.map((v) =>
                applyDiscount(v.price, v.discount ?? certificate.discount)
              )
            ),
            highPrice: Math.max(
              ...certificate.variants.map((v) =>
                applyDiscount(v.price, v.discount ?? certificate.discount)
              )
            ),
            offerCount: certificate.variants.length,
            availability: "https://schema.org/InStock",
          }
        : {
            "@type": "Offer",
            priceCurrency: "UAH",
            price: resolved.finalPrice,
            availability: "https://schema.org/InStock",
          };

    return {
      "@type": "Product",
      name: resolved.itemTitle,
      description: certificate.description,
      brand: {
        "@type": "Brand",
        name: siteConfig.business.name,
      },
      offers,
    };
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LocalBusiness",
        name: siteConfig.business.name,
        description: siteConfig.business.description,
        url: SITE_URL,
        telephone: siteConfig.contact.phone.raw,
        address: {
          "@type": "PostalAddress",
          addressLocality: siteConfig.business.location,
          addressCountry: "UA",
        },
      },
      {
        "@type": "ItemList",
        itemListElement: products.map((product, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: product,
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
