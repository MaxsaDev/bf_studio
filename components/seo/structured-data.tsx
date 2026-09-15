import { certificates } from "@/data/certificates";
import { CERTIFICATE_IMAGE } from "@/lib/certificate-config";
import { resolvePrice, applyDiscount } from "@/lib/pricing";
import { siteConfig } from "@/lib/site-config";
import type { Certificate } from "@/types/certificate";

const SITE_URL = "https://bodyfactory.studio";

/** Landing-page section anchor for each certificate type (see app/page.tsx) */
const SECTION_BY_TYPE: Record<Certificate["type"], string> = {
  massage_course: "courses",
  special: "special",
  named_gift_certificate: "named",
  gift_certificate: "gift",
  master_class: "masterclass",
};

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
      sku: `cert-${certificate.id}`,
      image: `${SITE_URL}${CERTIFICATE_IMAGE}`,
      url: `${SITE_URL}/#${SECTION_BY_TYPE[certificate.type]}`,
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
        image: `${SITE_URL}${CERTIFICATE_IMAGE}`,
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
