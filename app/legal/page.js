export const metadata = {
  title: "特定商取引法に基づく表記",
};

// 有料課金を行う場合、日本では特定商取引法に基づく表記が必須。
// 【要記入】の項目は事業者の実情に合わせて公開前に必ず埋めること。
const ROWS = [
  ["販売事業者", "【要記入】事業者名 / 屋号"],
  ["運営統括責任者", "【要記入】氏名"],
  ["所在地", "【要記入】請求があれば遅滞なく開示します（individual 事業者の場合）"],
  ["連絡先", "【要記入】メールアドレス / 電話番号"],
  ["販売価格", "各プランの購入画面に税込で表示します"],
  ["商品代金以外の必要料金", "インターネット接続料金・通信料金は利用者の負担"],
  ["支払方法", "【要記入】クレジットカード等（決済事業者確定後に記載）"],
  ["支払時期", "サブスクリプションは購入時および各更新日に課金されます"],
  ["役務の提供時期", "決済完了後ただちにプレミアム機能が有効になります"],
  [
    "返品・キャンセル",
    "デジタルコンテンツの性質上、提供開始後の返金は原則不可。サブスクリプションは次回更新日前までに解約することで自動更新を停止できます。",
  ],
];

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-sm leading-relaxed text-gray-800">
      <h1 className="mb-6 text-xl font-bold">特定商取引法に基づく表記</h1>
      <dl className="divide-y divide-gray-200 rounded-lg border border-gray-200">
        {ROWS.map(([label, value]) => (
          <div key={label} className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-3">
            <dt className="font-semibold text-gray-600">{label}</dt>
            <dd className="sm:col-span-2">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs text-gray-500">最終更新日: 【要記入】</p>
    </main>
  );
}
