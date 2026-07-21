import type { Metadata } from "next";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthContext";
import { Navbar } from "@/components/layout/Navbar";
import { VoiceAgent } from "@/components/voice/VoiceAgent";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});


const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700", "800", "900"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RAKSHA AI — Digital Public Safety Intelligence",
  description:
    "AI-powered platform to detect digital arrest scams, counterfeit currency, and fraud networks. Protecting India's digital future.",
  keywords:
    "AI, cybersecurity, fraud detection, digital arrest, counterfeit currency, graph intelligence, RAKSHA",
  openGraph: {
    title: "RAKSHA AI — Digital Public Safety Intelligence",
    description:
      "AI-powered platform to detect digital arrest scams, counterfeit currency, and fraud networks.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${jetbrains.variable}`}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <VoiceAgent />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


