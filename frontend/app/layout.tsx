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
  title: "Federal Public Service Commission — Digital ERP",
  description:
    "FPSC digitalization platform: public information, candidate portal, staff EMS, and CBT.",
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
