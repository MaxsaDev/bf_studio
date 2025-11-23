"use client";

import { MasterClassCertificate } from "@/types/certificate";
import { CertificateCardVisual } from "./certificate-card-visual";
import { CertificateCardControls } from "./certificate-card-controls";
import {
  CERTIFICATE_IMAGE,
  CERTIFICATE_IMAGE_DARK_OVERLAY,
  CERTIFICATE_MAX_WIDTH,
  MASTER_CLASS_SUBTITLE,
  MASTER_CLASS_SUBTITLE_COLOR,
} from "@/lib/certificate-config";
import { cn } from "@/lib/utils";

interface Props {
  certificate: MasterClassCertificate;
  onSelect?: (certificate: MasterClassCertificate) => void;
  isActive?: boolean;
}

export function MasterClassCard({
  certificate,
  onSelect,
  isActive = true,
}: Props) {
  return (
    <div className={cn("w-full mx-auto group perspective-1000")} style={{ maxWidth: CERTIFICATE_MAX_WIDTH }}>
      <CertificateCardVisual
        title={certificate.title}
        subtitle={MASTER_CLASS_SUBTITLE}
        subtitleColor={MASTER_CLASS_SUBTITLE_COLOR}
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
