import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://invistica.com.br"),
  title: {
    default: "Invística — Research quantamental aplicado a ações da B3",
    template: "%s · Invística",
  },
  description:
    "Motor proprietário de análise quantamental, aplicado a 947 ações da B3. Alpha de +15,4% a.a. sobre o IBOV desde 2019.",
  applicationName: "Invística",
  authors: [{ name: "Rafael Aquino" }],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://invistica.com.br",
    siteName: "Invística",
    title: "Invística — Research quantamental aplicado a ações da B3",
    description:
      "Motor proprietário de análise quantamental, aplicado a 947 ações da B3.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
