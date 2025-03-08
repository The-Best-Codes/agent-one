import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Geist, Geist_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const retroFont = Press_Start_2P({
  weight: "400",
  variable: "--font-retro",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgentOne",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${retroFont.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          value={{
            light: "light",
            dark: "dark",
            dim: "dim",
            "retro-light": "retro-light",
            "retro-dark": "retro-dark",
          }}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
