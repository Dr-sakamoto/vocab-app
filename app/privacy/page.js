export const metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 text-sm leading-relaxed text-gray-800">
      <h1 className="mb-6 text-xl font-bold">プライバシーポリシー</h1>
      <p className="mb-6 text-xs text-gray-500">
        本ポリシーは公開前に事業者の実情に合わせて精査してください（【要記入】箇所あり）。
      </p>

      <Section title="1. 取得する情報">
        <ul className="list-disc space-y-1 pl-5">
          <li>Googleログイン時に提供されるアカウント識別子・メールアドレス（認証目的）</li>
          <li>学習の進捗データ（単語ごとの正誤、解放状況、コレクション等）</li>
          <li>課金状態（プラン・有効期限。決済情報そのものは決済事業者が保持し、当方は保持しません）</li>
          <li>アクセス解析のための利用状況データ（導入する場合）</li>
        </ul>
      </Section>

      <Section title="2. 利用目的">
        <ul className="list-disc space-y-1 pl-5">
          <li>学習進捗のクラウド同期およびサービス提供</li>
          <li>プレミアム機能の提供と課金状態の管理</li>
          <li>不正利用の防止、サービスの改善</li>
        </ul>
      </Section>

      <Section title="3. 第三者提供・委託">
        <p>
          認証・データ保存に Supabase、決済に【要記入：決済事業者】を利用します。
          これらの委託先には目的の達成に必要な範囲でのみ情報を取り扱わせます。
          法令に基づく場合を除き、本人の同意なく第三者へ提供しません。
        </p>
      </Section>

      <Section title="4. データの保管と削除">
        <p>
          学習データはアカウントに紐づけて保管します。退会・削除の申し出があった場合、
          法令上の保存義務がある情報を除き、合理的な期間内に削除します。
          連絡先: 【要記入：問い合わせ先メール】
        </p>
      </Section>

      <Section title="5. Cookie・ローカルストレージ">
        <p>
          ログイン状態の保持や、未ログイン時の学習進捗の保存のためにブラウザの
          ローカルストレージを使用します。
        </p>
      </Section>

      <Section title="6. 改定">
        <p>本ポリシーは必要に応じて改定し、本ページで告知します。</p>
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
