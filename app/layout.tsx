import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
<Toaster position="top-left" />

export const metadata: Metadata = {
  title: "Etymon ― 単語が、まるい生き物になる。英単語学習RPG",
  description: "英単語を記述式で答えると、言葉がまるい生き物になる学習RPG",
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-dvh flex flex-col safe-area">{children}</body>
    </html>
  );
}
