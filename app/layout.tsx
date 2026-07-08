import type { Metadata } from "next";
import { Cormorant, Raleway, Press_Start_2P } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google'
import Nav from "./Nav";
import Footer from "./Footer";
import AskGooseWidget from "./components/AskGooseWidget";
import "./globals.css";


const cormorant = Cormorant({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const pressStart2P = Press_Start_2P({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://joseandgoose.com"),
  title: "Jose and Goose — building with AI, one project at a time",
  description:
    "I build things with AI and write down exactly how — chatbots, search, and automations. Goose is the schnauzer.",
  openGraph: {
    siteName: "Jose and Goose",
    type: "website",
    locale: "en_US",
    url: "https://joseandgoose.com",
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "Jose and Goose — building with AI, one project at a time" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cormorant.variable} ${raleway.variable} ${pressStart2P.variable}`}>
        <Nav />
        {children}
        <Footer />
        <AskGooseWidget />
        <GoogleAnalytics gaId="G-9GQ3BD74ZE" />
      </body>
    </html>
  );
}
