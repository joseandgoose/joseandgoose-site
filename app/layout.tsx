import type { Metadata } from "next";
import { Cormorant, Raleway, Press_Start_2P } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google'
import Nav from "./Nav";
import Footer from "./Footer";
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
  title: "Jose and Goose",
  description: "Celebrating the craft of things made with intention.",
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
        <GoogleAnalytics gaId="G-9GQ3BD74ZE" />
      </body>
    </html>
  );
}
