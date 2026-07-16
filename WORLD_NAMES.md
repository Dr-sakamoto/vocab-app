# Etymon ストーリー・世界 名称管理

> 命名基準・哲学は [`WORLD_STORY_GUIDE.md`](./WORLD_STORY_GUIDE.md) を参照。
> **このファイルが唯一の真実のソース。チャット履歴は参照しない。**
>
> `status: pending` の行はまだ独自名・独自設定が確定していない項目。
> `lib/storyBattles.ts` の実装は confirmed になった項目から一括更新する
> （`IP_REMEDIATION.md` P2.5 に対応）。

## 1. ZONEの関門（旧ジムリーダー・四天王）

方針（[`WORLD_STORY_GUIDE.md`](./WORLD_STORY_GUIDE.md) §2.1・§2.1.1）：人間キャラでは
なく「そのZONEを象徴する、とりわけ手強いEtymon」に置き換える。例外なし
（8番目のZONEも含めて全て強いEtymon。ライバルのみ人間として温存）。選定は
既存ラインの最終進化形を起用し、特にSection E（レア/神秘）や既にボスらしい
風格を持つ既存の単独キャラ（例：オディール）を優先的に割り当てる。
下表の「現行（参考）」は削除予定のポケモン由来名。「担当する強いEtymon」は
今後決める候補ライン。

| 内部ID | 現行（参考・削除予定） | 所在地（現行・参考） | habitatId | 担当する強いEtymon（候補） | status | memo |
|---|---|---|---|---|---|---|
| brock | タケシ | ニビジム | elmuria | — | pending | |
| misty | カスミ | ハナダジム | everstep | — | pending | |
| surge | マチス | クチバジム | eterna-desert | — | pending | |
| erika | エリカ | タマムシジム | great-firefly-city | — | pending | |
| sabrina | ナツメ | ヤマブキジム | eterna-desert | — | pending | |
| morty | キョウ | セキチクジム | everstep | — | pending | |
| blaine | カツラ | グレンジム | la-amaranta | — | pending | |
| giovanni-3 | サカキ | トキワジム | la-amaranta | — | pending | 完全分離が確定（§2.1）。この枠は「強いEtymon」側。サカキ（人物）は§2のサークルリーダー枠に一本化し、このZONEとは無関係の存在にする |
| elite-lorelei | カンナ | セキエイ高原 | schwanburg-castle | — | pending | |
| elite-bruno | シバ | セキエイ高原 | schwanburg-castle | — | pending | |
| elite-agatha | キクコ | セキエイ高原 | schwanburg-castle | — | pending | |
| elite-lance | ワタル | セキエイ高原 | schwanburg-castle | — | pending | |
| champion-rival | ライバル | えいゆうのへや | schwanburg-castle | （対象外・人間のまま） | confirmed | ライバルは温存方針確定（§2.1）。最終決戦の相手として人間のまま据え置く |

## 2. 敵対組織（旧ロケット団）

方針（[`WORLD_STORY_GUIDE.md`](./WORLD_STORY_GUIDE.md) §2.2）：犯罪組織ではなく
「各地でUMAを探し歩いているサークル」。ZONE関門とは完全分離済み（§2.1で確定）
——このサークル・リーダーはどのZONEとも紐づかず、UMA関連の寄り道イベントに
のみ登場する。組織名・リーダー名は未確定。

拠点は「廃墟・使われていない施設に住み着いている」形で確定済み（§2.2）。
具体的な建物・場所は未確定。

UMA枠（モスマン＝onix／チュパカブラ＝hitmonlee／ユニコーン＝farfetchd／
イエティ＝yeti）の生息地に合わせて、各地の遭遇イベントとして再構成する想定。

| 内部ID | 現行（参考） | 所在地（現行・参考） | 新設定 | status | memo |
|---|---|---|---|---|---|
| （組織名） | ロケット団 | — | UMA探索サークル（名称未定） | pending | |
| （サークルのリーダー） | サカキ | — | サークルリーダー（名称未定） | pending | ZONE関門とは無関係の独立キャラとして一本化（§2.1で確定）。giovanni-1/2/3の「サカキ」設定はこの1キャラに統合する |
| rocket-mt-moon | ムサシ＆コジロウ | おつきみやま | サークルメンバー | pending | |
| rocket-scout | ロケット団スカウト員 | 24ばんどうろ | サークルメンバー | pending | |
| rocket-thief | 泥棒ロケット団員 | ハナダシティ | サークルメンバー | pending | 「泥棒」という役柄は犯罪組織前提のため要再設定 |
| rocket-celadon | ムサシ＆コジロウ | タマムシ地下アジト | サークルメンバー | pending | 拠点は「廃墟・使われていない施設」に確定（§2.2）。具体的な建物は未定 |
| giovanni-1 | サカキ | タマムシ地下アジト | サークルリーダー | pending | |
| rocket-tower | ロケット団員 | エティモンタワー最上階 | サークルメンバー | pending | |
| rocket-silph | ムサシ＆コジロウ | シルフカンパニー11かい | サークルメンバー | pending | 「企業占拠」ではなく「廃墟に住み着いている」方向で再設定（§2.2） |
| giovanni-2 | サカキ | シルフカンパニー社長室 | サークルリーダー | pending | |

## 3. 地名・施設名

「地方」レベルの世界地理（habitatId）はすでに `ETYMON_NAMES.md` のhabitat列に
部分的に存在する（エルムリア／ほしのくもい／ウルトラブルー／オールドスモーク／
エテルナ砂漠／大流蛍楼宇／エバーステップ／アルバピーク／ラ・アマランタ／
タラシス海底神殿／カパドラ洞窟・地下帝国／シュヴァンブルク城）。下表はその中の
個別スポット（都市・施設・ルート）の独自名。

| 現行地名（参考・削除予定） | 種別 | habitatId | 独自案 | status | memo |
|---|---|---|---|---|---|
| （はじまりの町） | 開始地点の町 | 未定（要新規habitat検討） | アップルタウン | confirmed | ドラクエ的イメージ。`WORLD_STORY_GUIDE.md`§2.4a。現行`rival-1`の`habitatId: "elmuria"`との対応関係は実装時に整理する |
| オーキド研究所 | ナビの拠点施設 | great-firefly-city | — | pending | 開始地点（アップルタウン）には置かず、大流蛍楼宇内の施設として再配置することが確定（§2.4a）。施設名自体は未定 |
| ニビジム | ZONE関門施設 | elmuria | — | pending | |
| 22ばんどうろ | ルート | elmuria | — | pending | |
| おつきみやま | 山 | hoshi-no-kumoi | — | pending | 現行`fossil-brother`（化石復元）の舞台。化石サブプロットはエテルナピラミッド（下記）へ移転が確定（§2.4b）。`rocket-mt-moon`（UMA探索サークルの遭遇イベント）をこの地に残すかは未定 |
| 24ばんどうろ | ルート | ultra-blue | — | pending | |
| ハナダシティ／ハナダジム | 街／ZONE関門施設 | everstep / old-smoke | — | pending | |
| サント・アンヌ号 | 移動施設（客船） | old-smoke | — | pending | |
| クチバジム | ZONE関門施設 | eterna-desert | — | pending | |
| （新規：化石サブプロットの移転先） | ピラミッド（多階層） | eterna-desert | エテルナピラミッド | confirmed | 確定稿は[`WORLD_STORY_ETERNA_PYRAMID.md`](./WORLD_STORY_ETERNA_PYRAMID.md)。最深部で「スーパーソウル」の魂系アイテムを使い**タマテ**（王女、称号なしの単独キャラとして確定）を蘇らせる単一の筋。現行の化石二択は廃止。`ETYMON_NAMES.md`に登録済み |
| タマムシジム | ZONE関門施設 | great-firefly-city | — | pending | |
| タマムシ地下アジト | 敵対組織拠点 | great-firefly-city | — | pending | 「地下アジト」は犯罪組織前提の語感。応援団の拠点として無害な形に作り直す（§2の方針） |
| エティモンタワー3かい／最上階 | 施設 | great-firefly-city | Etymonタワー | confirmed | 既にポケモンタワーから改名済み。追加変更なし |
| シルフカンパニー11かい／社長室 | 施設（乗っ取られた企業） | great-firefly-city | — | pending | 「企業乗っ取り」プロット自体の代替が必要 |
| 12・16ばんどうろ | ルート | old-smoke | — | pending | |
| ヤマブキジム | ZONE関門施設 | eterna-desert | — | pending | |
| ヤマブキ格闘道場 | 施設 | everstep | — | pending | |
| むじんはつでんしょ | 施設 | great-firefly-city | — | pending | |
| セキチクジム | ZONE関門施設 | everstep | — | pending | |
| ふたごじま | 島 | alb-peak | — | pending | |
| グレンジム | ZONE関門施設 | la-amaranta | — | pending | |
| トキワジム | ZONE関門施設 | la-amaranta | — | pending | |
| チャンピオンロード | ルート | schwanburg-castle | — | pending | |
| セキエイ高原 | エリア | schwanburg-castle | — | pending | |
| えいゆうのへや | 施設（最終決戦の間） | schwanburg-castle | — | pending | |
| ハナダのどうくつ | 洞窟 | kapadra-underground | — | pending | |
| ？？？ | 未公開地点 | — | — | pending | `mew`系バトルの所在地。名称「ハジマリ」は`IP_CONCEPT.md`§7「はじまりの言葉」と既に整合しているため、地名側も同じ神話に寄せる |

## 4. バッジ（称号）

現行はすべて色名のみ（グレー／ブルー／オレンジ／レインボー／ゴールド／ピンク／
クリムゾン／グリーン）で、ポケモン固有名詞への依存は低い。独自の「称号」概念
（[`WORLD_STORY_GUIDE.md`](./WORLD_STORY_GUIDE.md) §2.3・§3で保留中）が決まった
段階で、色名のままにするか概念に合わせて再設計するかを判断する。優先度は低い。

## 5. オープンクエスチョン（未整理のまま残っている論点）

構造レベルの論点（サカキの役割重複、拠点の性質、ZONE関門の選定方法、地名の
命名方針）は [`WORLD_STORY_GUIDE.md`](./WORLD_STORY_GUIDE.md) §2.1〜2.4で
決着済み。残っているのは個別の命名・具体設定のみ：

- 敵対組織（UMA探索サークル）自体の名称、サークルリーダーの名称・性格設定
- 拠点として使う「廃墟・使われていない施設」の具体的な場所・建物の性質
- §1・§2・§3の各行の独自名そのもの（表内`status: pending`の項目全般）
- 「称号」「頂点」の独自コンセプト（`WORLD_STORY_GUIDE.md` §2.3、保留中）
