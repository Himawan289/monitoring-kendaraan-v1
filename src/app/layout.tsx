import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Content } from "@/components/content";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AutoMonitor",
  description: "Monitoring kendaraan pribadi: odometer OCR, servis, pajak, tekanan ban.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-base text-fg">
        <Nav />
        <Content>{children}</Content>
      </body>
    </html>
  );
}
