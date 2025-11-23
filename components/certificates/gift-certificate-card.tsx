"use client";

import { GiftCertificate } from "@/types/certificate";
import { CertificateCardVisual } from "./certificate-card-visual";
import { CertificateCardControls } from "./certificate-card-controls";
import {
  CERTIFICATE_IMAGE,
  CERTIFICATE_IMAGE_DARK_OVERLAY,
  CERTIFICATE_MAX_WIDTH,
  GIFT_CERT_DENOMINATION_SIZE,
  GIFT_CERT_CURRENCY_SIZE,
} from "@/lib/certificate-config";
import { cn } from "@/lib/utils";

interface Props {
  certificate: GiftCertificate;
  onSelect?: (certificate: GiftCertificate) => void;
  isActive?: boolean;
}

export function GiftCertificateCard({
  certificate,
  onSelect,
  isActive = true,
}: Props) {
  return (
    <div className={cn("w-full mx-auto group perspective-1000")} style={{ maxWidth: CERTIFICATE_MAX_WIDTH }}>
      <CertificateCardVisual
        title={
          <div className="flex items-start justify-center leading-[0.8] -space-x-2 ml-8">
            <span className={cn(GIFT_CERT_DENOMINATION_SIZE, "font-bold tracking-tighter text-stone-900 dark:text-stone-50")}>
              {certificate.denomination}
            </span>
            <span className={cn(GIFT_CERT_CURRENCY_SIZE, "font-medium text-stone-500 dark:text-stone-400 mt-4 sm:mt-6 tracking-widest")}>
              UAH
            </span>
          </div>
        }
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
