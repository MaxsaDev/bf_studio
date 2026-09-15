import type { Metadata } from "next";
import localFont from "next/font/local";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { THEME_MODE } from "@/lib/theme-config";
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

export const metadata: Metadata = {
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
        url: "/bf_card_white_template.jpg",
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
    images: ["/bf_card_white_template.jpg"],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body
        className={`${evolventa.variable} ${playfair.variable} antialiased font-sans selection:bg-stone-200 dark:selection:bg-stone-800`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={THEME_MODE}
          forcedTheme={THEME_MODE}
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
