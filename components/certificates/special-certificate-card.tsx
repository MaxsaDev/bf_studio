"use client";

import { SpecialCertificate } from "@/types/certificate";
import { CertificateCardVisual } from "./certificate-card-visual";
import { CertificateCardControls } from "./certificate-card-controls";
import { cn } from "@/lib/utils";
import {
  CERTIFICATE_IMAGE,
  CERTIFICATE_IMAGE_DARK_OVERLAY,
  CERTIFICATE_MAX_WIDTH,
  SPECIAL_CERTIFICATE_SUBTITLE,
  SPECIAL_CERTIFICATE_COLOR,
} from "@/lib/certificate-config";

interface Props {
  certificate: SpecialCertificate;
  onSelect?: (certificate: SpecialCertificate) => void;
  isActive?: boolean;
}

export function SpecialCertificateCard({
  certificate,
  onSelect,
  isActive = true,
}: Props) {
  return (
    <div
      className={cn("w-full mx-auto group perspective-1000")}
      style={{ maxWidth: CERTIFICATE_MAX_WIDTH }}
    >
      <CertificateCardVisual
        title={certificate.title.toUpperCase()}
        titleColor={SPECIAL_CERTIFICATE_COLOR}
        subtitle={SPECIAL_CERTIFICATE_SUBTITLE}
        layoutId={`card-visual-${certificate.id}`}
        imageSrc={CERTIFICATE_IMAGE}
        isDark={CERTIFICATE_IMAGE_DARK_OVERLAY}
      />
      <CertificateCardControls
        price={certificate.price}
        discount={certificate.discount}
        onBuy={() => onSelect?.(certificate)}
        isActive={isActive}
      />
    </div>
  );
}
