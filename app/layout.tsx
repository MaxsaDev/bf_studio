import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { blackFridaySchedule } from "@/lib/black-friday";
import { certificateImage } from "@/lib/certificate-config";
import { cache } from "react";
import { StructuredData } from "@/components/seo/structured-data";

const evolventa = localFont({
  src: [
    {
      path: "./fonts/Evolventa/Evolventa-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Evolventa/Evolventa-Oblique.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/Evolventa/Evolventa-Bold.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Evolventa/Evolventa-BoldOblique.ttf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-evolventa",
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// The shop and its offers must reflect the request time, including after a cutoff.
export const dynamic = "force-dynamic";
const requestCampaign = cache(() => blackFridaySchedule());

export function generateMetadata(): Metadata {
  const image = certificateImage(requestCampaign().active);
  return {
    title: {
      default: "Body Factory Studio | Premium",
      // Sub-pages export a plain title and get the brand suffix for free
      template: "%s | Body Factory",
    },
    description: "Оберіть ідеальний подарунок на масаж у Body Factory",
    keywords: [
      "Body Factory",
      "Body Factory Studio",
      "Premium",
      "Масаж",
      "Масаж у Body Factory",
      "Масаж у Body Factory Studio",
      "Масаж у Body Factory Premium",
    ],
    authors: [{ name: "Body Factory", url: "https://bodyfactory.studio/" }],
    creator: "Body Factory",
    publisher: "Body Factory",
    metadataBase: new URL("https://bodyfactory.studio/"),
    openGraph: {
      title: "Body Factory Studio | Premium",
      description: "Оберіть ідеальний подарунок на масаж у Body Factory",
      locale: "uk_UA",
      type: "website",
      images: [
        {
          url: image,
          width: 1115,
          height: 700,
          alt: "Body Factory подарунковий сертифікат",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Body Factory Studio | Premium",
      description: "Оберіть ідеальний подарунок на масаж у Body Factory",
      images: [image],
    },
    manifest: "/site.webmanifest",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const campaign = requestCampaign();
  return (
    <html lang="uk" className={campaign.active ? "dark" : undefined} suppressHydrationWarning>
      <head>
        <StructuredData blackFriday={campaign.active} />
      </head>
      <body
        className={`${evolventa.variable} ${playfair.variable} antialiased font-sans selection:bg-stone-200 dark:selection:bg-stone-800`}
      >
        <ThemeProvider {...campaign}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
