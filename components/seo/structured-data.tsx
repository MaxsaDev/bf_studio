import { certificates } from "@/data/certificates";
import { certificateImage } from "@/lib/certificate-config";
import { resolvePrice } from "@/lib/pricing";
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
export function StructuredData({ blackFriday }: { blackFriday: boolean }) {
  const image = SITE_URL + certificateImage(blackFriday);
  const products = certificates.map((certificate) => {
    const resolved = resolvePrice(certificate, null, blackFriday);

    const variantPrices = certificate.type === "massage_course"
      ? certificate.variants.map((v) => resolvePrice(certificate, v.id, blackFriday).finalPrice)
      : [];

    const offers =
      certificate.type === "massage_course"
        ? {
            "@type": "AggregateOffer",
            priceCurrency: "UAH",
            lowPrice: Math.min(...variantPrices),
            highPrice: Math.max(...variantPrices),
            offerCount: variantPrices.length,
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
      image,
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
        image,
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
