export type CertificateType =
  | "massage_course"
  | "gift_certificate"
  | "named_gift_certificate"
  | "master_class"
  | "special";

export interface Discount {
  percentage: number;
  endDate?: string;
  label?: string;
}

export interface CertificateVariant {
  id: string;
  label: string; // Button label: "1 Сеанс", "6 Сеансів"
  title: string; // Full title for context: "Разовий сеанс", "Експрес курс"
  price: number;
  sessions: number;
  discount?: Discount;
}

export interface BaseCertificate {
  id: number;
  type: CertificateType;
  description: string;
  discount?: Discount;
}

export interface MassageCourseCertificate extends BaseCertificate {
  type: "massage_course";
  title: string;
  // variants replace pricing and specific session fields
  variants: CertificateVariant[];
}

export interface GiftCertificate extends BaseCertificate {
  type: "gift_certificate";
  denomination: number;
  price: number;
}

export interface NamedGiftCertificate extends BaseCertificate {
  type: "named_gift_certificate";
  title: string;
  denomination: number;
  price: number;
}

export interface MasterClassCertificate extends BaseCertificate {
  type: "master_class";
  title: string;
  price: number;
}

export interface SpecialCertificate extends BaseCertificate {
  type: "special";
  title: string;
  price: number;
}

export type Certificate =
  | MassageCourseCertificate
  | GiftCertificate
  | NamedGiftCertificate
  | MasterClassCertificate
  | SpecialCertificate;
