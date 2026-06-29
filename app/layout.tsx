import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Guiman News - Seu portal de notícias",
  description: "Notícias que importam — ciência, tecnologia, economia e muito mais",
  icons: {
    icon: "/g.png",
    shortcut: "/g.png",
    apple: "/g.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="icon" type="image/png" href="../public/g.png" /> 
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
