import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
   title: "Tars Chat",
  description: "Real-time messaging app",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ height: "100%", overflow: "hidden" }}>
      <body
        className={inter.className}
        style={{
          height: "100dvh",   // ← dynamic viewport height — the key mobile fix
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
