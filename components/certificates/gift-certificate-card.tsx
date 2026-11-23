"use client";

import { GiftCertificate } from "@/types/certificate";
import { CertificateCardVisual } from "./certificate-card-visual";
import { CertificateCardControls } from "./certificate-card-controls";
import {
  CERTIFICATE_MAX_WIDTH,
  GIFT_CERT_CURRENCY_SIZE,
  giftDenominationSize,
} from "@/lib/certificate-config";
import { cn } from "@/lib/utils";

interface Props {
  certificate: GiftCertificate;
  onSelect?: (certificate: GiftCertificate) => void;
  isActive?: boolean;
  imagePriority?: boolean;
}

export function GiftCertificateCard({
  certificate,
  onSelect,
  isActive = true,
  imagePriority = false,
}: Props) {
  return (
    <div className={cn("w-full mx-auto group perspective-1000")} style={{ maxWidth: CERTIFICATE_MAX_WIDTH }}>
      <CertificateCardVisual
        title={
          <div className="flex items-center justify-center gap-[1cqw] leading-[0.8]">
            <span className={cn(giftDenominationSize(certificate.denomination), "font-bold tracking-tighter text-stone-900 dark:text-stone-50")}>
              {certificate.denomination}
            </span>
            <span className={cn(GIFT_CERT_CURRENCY_SIZE, "font-medium text-stone-500 dark:text-stone-400 tracking-widest")}>
              UAH
            </span>
          </div>
        }
        layoutId={`card-visual-${certificate.id}`}
        imagePriority={imagePriority}
      />

      <CertificateCardControls
        certificate={certificate}
        onBuy={() => onSelect?.(certificate)}
        isActive={isActive}
      />
    </div>
  );
}
