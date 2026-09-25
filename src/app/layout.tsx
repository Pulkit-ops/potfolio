import type { Metadata, Viewport } from "next";
import { Anton, Outfit, Plus_Jakarta_Sans, Alex_Brush } from "next/font/google";
import "./globals.css";
import Footer from "@/components/layout/Footer";
import AmbientGlow from "@/components/layout/AmbientGlow";
import { ToastProvider } from "@/components/ui/Toast";
import { ContactModalProvider } from "@/components/contact/ContactModalContext";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const alexBrush = Alex_Brush({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://pulkit.social"),
  title: "Pulkit Maheshwari | Creative Direction & Social Strategy",
  description:
    "Portfolio of Pulkit Maheshwari - Creative Director, Short-Form Video Producer, and Social Strategist. Crafting content that stops the scroll.",
  openGraph: {
    title: "Pulkit Maheshwari | Creative Direction & Social Portfolio",
    description:
      "Crafting high-retention video, unmistakable brand aesthetics, and content people actually want to watch.",
    images: ["/assets/hero-bg.webp"],
    type: "website",
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#08090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${outfit.variable} ${jakarta.variable} ${alexBrush.variable}`}
    >
      <body className="bg-[#08090b] text-[#f5f6f8] min-h-screen relative antialiased selection:bg-[#e51d24] selection:text-white">
        <ToastProvider>
          <ContactModalProvider>
            <AmbientGlow />
            <main className="min-h-screen relative z-10">{children}</main>
            <Footer />
          </ContactModalProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
