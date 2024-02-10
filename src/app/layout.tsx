import type { Metadata } from "next";
import "./globals.css";
import { inter } from "@/config/fonts";

//Layout general para todas las paginas

export const metadata: Metadata = {
  title: {
    template: '%s - Teslo | Shop',//para que todas las paginas tengan el mismo titulo
    default: 'Home - Teslo | Shop',
  },
  description: "Una tienda virtual de productos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
