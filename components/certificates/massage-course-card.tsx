"use client";

import { useState } from "react";
import { MassageCourseCertificate } from "@/types/certificate";
import { CertificateCardVisual } from "./certificate-card-visual";
import { CertificateCardControls } from "./certificate-card-controls";
import {
  CERTIFICATE_IMAGE,
  CERTIFICATE_IMAGE_DARK_OVERLAY,
  CERTIFICATE_MAX_WIDTH,
} from "@/lib/certificate-config";
import { cn } from "@/lib/utils";

interface Props {
  certificate: MassageCourseCertificate;
  onSelect?: (certificate: MassageCourseCertificate, variantId: string) => void;
  isActive?: boolean;
}

export function MassageCourseCard({
  certificate,
  onSelect,
  isActive = true,
}: Props) {
  // Default to the last variant (usually the full course/biggest option)
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    certificate.variants[certificate.variants.length - 1].id
  );

  const selectedVariant =
    certificate.variants.find((v) => v.id === selectedVariantId) ||
    certificate.variants[0];

  return (
    <div
      className={cn("w-full mx-auto group perspective-1000")}
      style={{ maxWidth: CERTIFICATE_MAX_WIDTH }}
    >
      <CertificateCardVisual
        title={certificate.title}
        subtitle={
          selectedVariant.sessions === 1
            ? "1 сеанс"
            : `${selectedVariant.sessions} сеансів`
        }
        layoutId={`card-visual-${certificate.id}`}
        imageSrc={CERTIFICATE_IMAGE}
        isDark={CERTIFICATE_IMAGE_DARK_OVERLAY}
      />

      <CertificateCardControls
        price={selectedVariant.price}
        discount={selectedVariant.discount}
        variants={certificate.variants}
        selectedVariantId={selectedVariantId}
        onVariantChange={setSelectedVariantId}
        onBuy={() => onSelect?.(certificate, selectedVariantId)}
        isActive={isActive}
      />
    </div>
  );
}
