import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import RegisterServiceWorker from "./components/RegisterServiceWorker";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

// 英単語（出題語）とスコアの数字だけ Space Grotesk を当てる。日本語本文は
// OS標準のゴシックに任せる（globals.css の body）。装飾書体は字形の情報量が
// 落ち、未知語の綴りを読み取る場面で不利になるため使わない。

export const metadata: Metadata = {
  title: "VocabBlitz ― 記述式で答える英単語学習",
  description:
    "英単語の日本語訳を記述式で入力し、表記ゆれはAIが判定する英単語学習アプリ「VocabBlitz（ボキャブリッツ）」",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VocabBlitz",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  // アプリの地の色（--surface-0）と揃える。ブラウザのUIとアプリの間に
  // 色の段差ができると、そのつど視線が境界に引かれる。
  themeColor: "#12141a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`h-full antialiased ${spaceGrotesk.variable}`}>
      <body className="min-h-dvh flex flex-col safe-area">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
