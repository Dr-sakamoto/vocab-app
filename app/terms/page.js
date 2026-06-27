export const metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-sm leading-relaxed text-gray-800">
      <h1 className="mb-6 text-xl font-bold">利用規約</h1>
      <p className="mb-6 text-xs text-gray-500">
        本規約は雛形です。公開前に事業者の実情・準拠法に合わせて精査してください（【要記入】箇所あり）。
      </p>

      <Section title="第1条（適用）">
        <p>本規約は、本サービスの利用に関する一切の関係に適用されます。</p>
      </Section>

      <Section title="第2条（アカウント）">
        <p>
          一部機能の利用にはGoogleアカウントによるログインが必要です。利用者は自己の責任で
          アカウントを管理するものとします。
        </p>
      </Section>

      <Section title="第3条（プレミアムプラン・課金）">
        <ul className="list-disc space-y-1 pl-5">
          <li>プレミアムプランは購入画面に表示する料金・期間で提供されます。</li>
          <li>
            サブスクリプションは、解約の手続きがない限り各期間満了時に自動更新されます。
            次回更新日前までに解約することで自動更新を停止できます。
          </li>
          <li>
            返金の取り扱いは「特定商取引法に基づく表記」に従います。
          </li>
        </ul>
      </Section>

      <Section title="第4条（禁止事項）">
        <p>
          法令違反、不正アクセス、課金状態の詐称、リバースエンジニアリングによる特典の不正取得、
          その他運営が不適切と判断する行為を禁止します。
        </p>
      </Section>

      <Section title="第5条（コンテンツの権利）">
        <p>
          本サービス内のコンテンツ（テキスト・画像・音声・プログラム等）の権利は運営または
          正当な権利者に帰属します。利用者は私的利用の範囲を超えて複製・配布できません。
        </p>
      </Section>

      <Section title="第6条（免責）">
        <p>
          本サービスは現状有姿で提供され、特定目的への適合性等を保証しません。学習成果について
          いかなる結果も保証しません。
        </p>
      </Section>

      <Section title="第7条（規約の変更）">
        <p>運営は必要に応じて本規約を変更でき、本ページでの掲示をもって効力を生じます。</p>
      </Section>

      <Section title="第8条（準拠法・管轄）">
        <p>本規約は日本法に準拠し、【要記入：管轄裁判所】を専属的合意管轄とします。</p>
      </Section>

      <p className="mt-8 text-xs text-gray-500">最終更新日: 【要記入】</p>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-base font-semibold">{title}</h2>
      <div className="text-gray-700">{children}</div>
    </section>
  );
}
