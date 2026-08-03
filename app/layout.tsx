import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";
import "./globals.css";
import RegisterServiceWorker from "./components/RegisterServiceWorker";

// 出題語だけに当てるセリフ体。UIはすべてサンセリフなので、
// 「セリフ体で組まれているもの＝読んで答えるべき語」が書体だけで分かる。
// セリフは字形の差が出やすく、未知語の綴りを読み取る場面でも有利。
// 使うのは出題語ただ一つに限定する（スコアやXPはUI側なのでサンセリフのまま）。
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-word",
  display: "swap",
});

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
    <html lang="ja" className={`h-full antialiased ${newsreader.variable}`}>
      <body className="min-h-dvh flex flex-col safe-area">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
