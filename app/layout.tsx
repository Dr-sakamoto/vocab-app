import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
<Toaster position="top-left" />

export const metadata: Metadata = {
  title: "Etymon ― 語源の獣を集める英単語学習RPG",
  description: "英単語を記述式で答え、語源（語根）の獣を集める学習RPG",
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
