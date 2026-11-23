"use client";

import { SpecialCertificate } from "@/types/certificate";
import { CertificateCardVisual } from "./certificate-card-visual";
import { CertificateCardControls } from "./certificate-card-controls";
import { cn } from "@/lib/utils";
import {
  CERTIFICATE_MAX_WIDTH,
  SPECIAL_CERTIFICATE_SUBTITLE,
  SPECIAL_CERTIFICATE_COLOR,
} from "@/lib/certificate-config";

interface Props {
  certificate: SpecialCertificate;
  onSelect?: (certificate: SpecialCertificate) => void;
  isActive?: boolean;
  imagePriority?: boolean;
}

export function SpecialCertificateCard({
  certificate,
  onSelect,
  isActive = true,
  imagePriority = false,
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
