import type { Metadata } from "next";
import { Libre_Baskerville, Source_Sans_3 } from "next/font/google";

import "./globals.css";

const display = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

const ui = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: {
    default: "Federal Public Service Commission (FPSC) — Official Digital Portal",
    template: "%s | FPSC Pakistan",
  },
  description:
    "Official FPSC digital platform for consolidated advertisements, candidate applications, CSS/MPT, CBT, and recruitment workflows. Government of Pakistan.",
  keywords: [
    "FPSC",
    "Federal Public Service Commission",
    "CSS",
    "MPT",
    "General Recruitment",
    "jobs Pakistan",
    "CBT",
  ],
  authors: [{ name: "Federal Public Service Commission" }],
  openGraph: {
    title: "Federal Public Service Commission",
    description:
      "Apply online, download admit cards, and track FPSC examinations.",
    locale: "en_PK",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
