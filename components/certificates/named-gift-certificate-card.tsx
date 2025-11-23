"use client";

import { NamedGiftCertificate } from "@/types/certificate";
import { CertificateCardVisual } from "./certificate-card-visual";
import { CertificateCardControls } from "./certificate-card-controls";
import {
  CERTIFICATE_IMAGE,
  CERTIFICATE_IMAGE_DARK_OVERLAY,
  CERTIFICATE_MAX_WIDTH,
  NAMED_CERT_TITLE_SIZE,
  NAMED_CERTIFICATE_BACKGROUND,
  getNamedCertificateColor,
  extractThemeName,
} from "@/lib/certificate-config";
import { cn } from "@/lib/utils";

interface Props {
  certificate: NamedGiftCertificate;
  onSelect?: (certificate: NamedGiftCertificate) => void;
  isActive?: boolean;
}

export function NamedGiftCertificateCard({
  certificate,
  onSelect,
  isActive = true,
}: Props) {
  const themeName = extractThemeName(certificate.title);
  const themeColor = getNamedCertificateColor(themeName);

  return (
    <div
      className={cn("w-full mx-auto group perspective-1000")}
      style={{ maxWidth: CERTIFICATE_MAX_WIDTH }}
    >
      <CertificateCardVisual
        title={
          <div className="flex items-center justify-center">
            <span
              className={cn(NAMED_CERT_TITLE_SIZE, "font-light leading-none")}
            >
              {themeName.toUpperCase()}
            </span>
          </div>
        }
        titleColor={themeColor}
        subtitle={`${certificate.denomination} ₴`}
        className={NAMED_CERTIFICATE_BACKGROUND}
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
