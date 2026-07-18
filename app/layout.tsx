import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

// font-fantasy（Lv./ATK/HPなどのシステム表示用）は文字がMedievalSharp、
// 数字だけMetamorphousになる合成書体。unicode-rangeで文字種を振り分ける
// 自前の@font-face（globals.css）で構成するため、next/fontでは読み込まない。

export const metadata: Metadata = {
  title: "Etymon ― 単語が、まるい生き物になる。英単語学習RPG",
  description: "英単語を記述式で答えると、言葉がまるい生き物になる学習RPG",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`h-full antialiased ${spaceGrotesk.variable}`}>
      <head>
        {/* EGAレトロRPGスキンのビットマップ（ドット）フォント DotGothic16。
            日本語（漢字・かな）と英字をドットで表示。実行時に unicode-range で
            使用文字ぶんだけ取得するため、CJKでもロードは軽い。 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DotGothic16&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh flex flex-col safe-area">{children}</body>
    </html>
  );
}
