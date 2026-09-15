import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";
import { SuccessPaymentContent } from "./success-payment-content";

export const metadata: Metadata = {
  title: siteConfig.successPage.title,
  description: siteConfig.successPage.subtitle,
  // Post-payment landing — never index (robots.ts disallows it as well)
  robots: { index: false, follow: false },
};

export default function SuccessPaymentPage() {
  return <SuccessPaymentContent />;
}
