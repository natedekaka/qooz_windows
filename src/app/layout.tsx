import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Qooz - Real-time Quiz Platform",
  description: "Platform kuis real-time untuk pembelajaran interaktif",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
