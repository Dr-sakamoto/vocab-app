import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ポケモン英単語クイズ",
  description: "英単語を記述式で答えるポケモンのクイズゲーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
