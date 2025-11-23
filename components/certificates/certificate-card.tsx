"use client";

import { Certificate } from "@/types/certificate";
import { MassageCourseCard } from "./massage-course-card";
import { GiftCertificateCard } from "./gift-certificate-card";
import { NamedGiftCertificateCard } from "./named-gift-certificate-card";
import { MasterClassCard } from "./master-class-card";
import { SpecialCertificateCard } from "./special-certificate-card";

interface CertificateCardProps {
  certificate: Certificate;
  onSelect?: (certificate: Certificate, variantId?: string) => void;
  isActive?: boolean;
}

export function CertificateCard(props: CertificateCardProps) {
  switch (props.certificate.type) {
    case "massage_course":
      return <MassageCourseCard {...props} certificate={props.certificate} />;
    case "gift_certificate":
      return <GiftCertificateCard {...props} certificate={props.certificate} />;
    case "named_gift_certificate":
      return (
        <NamedGiftCertificateCard {...props} certificate={props.certificate} />
      );
    case "master_class":
      return <MasterClassCard {...props} certificate={props.certificate} />;
    case "special":
      return (
        <SpecialCertificateCard {...props} certificate={props.certificate} />
      );
    default:
      return null;
  }
}
