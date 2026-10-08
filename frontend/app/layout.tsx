import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from "next/font/google";

import "./globals.css";

const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-serif",
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "FPSC Integrated ERP — Recruitment & Examination Platform",
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
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className={sans.className}>{children}</body>
    </html>
  );
}
