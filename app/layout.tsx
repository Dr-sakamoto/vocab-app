import type { Metadata, Viewport } from "next";
import { Newsreader, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import RegisterServiceWorker from "./components/RegisterServiceWorker";

// 出題語以外のすべて（日本語・英数字とも）を受け持つ細めのゴシック。
//
// これまでは system-ui を先頭に置いていたため、同じ一行の中でも
// ラテン文字だけOSのUI書体（SF Pro / Segoe UI）、日本語だけ Hiragino /
// Yu Gothic という二重書体になっていた。和文と欧文を1ファミリーで持つ
// Noto Sans JP に寄せることで、字面・太さ・字幅が全文字種で揃う。
//
// ウェイトは 300 ひとつだけ。強弱は太さではなく文字色（--ink-1/2/3）と
// サイズで付ける方針なので、太字は元々不要だった。1ウェイトに絞ることで
// 見た目が完全に揃い、CJKのサブセット取得量も半分になる
// （初回表示 251KB → 161KB、10問プレイ後 455KB → 302KB で実測）。
const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300"],
  variable: "--font-ui",
  display: "swap",
});

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
    <html
      lang="ja"
      className={`h-full antialiased ${notoSansJp.variable} ${newsreader.variable}`}
    >
      <body className="min-h-dvh flex flex-col safe-area">
        {/*
          クイズの状態を持つ Provider はここではなく app/(quiz)/layout.tsx に
          置いている。単語クイズ（`/`・`/result`）と英作文（`/compose`）は
          別のアプリで、状態も読み込むデータも共有しないため。
        */}
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
