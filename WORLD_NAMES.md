# Etymon ストーリー・世界 名称管理

> 命名基準・哲学は [`WORLD_STORY_GUIDE.md`](./WORLD_STORY_GUIDE.md) を参照。
> **このファイルが唯一の真実のソース。チャット履歴は参照しない。**
>
> `status: pending` の行はまだ独自名・独自設定が確定していない項目。
> `lib/storyBattles.ts` の実装は confirmed になった項目から一括更新する
> （`IP_REMEDIATION.md` P2.5 に対応）。

## 1. ZONEの関門（旧ジムリーダー・四天王）

方針（[`WORLD_STORY_GUIDE.md`](./WORLD_STORY_GUIDE.md) §2.1）：人間キャラではなく
「そのZONEを象徴する、とりわけ手強いEtymon」に置き換える。下表の「現行（参考）」は
削除予定のポケモン由来名。「担当する強いEtymon」は今後決める候補ライン。

| 内部ID | 現行（参考・削除予定） | 所在地（現行・参考） | habitatId | 担当する強いEtymon（候補） | status | memo |
|---|---|---|---|---|---|---|
| brock | タケシ | ニビジム | elmuria | — | pending | |
| misty | カスミ | ハナダジム | everstep | — | pending | |
| surge | マチス | クチバジム | eterna-desert | — | pending | |
| erika | エリカ | タマムシジム | great-firefly-city | — | pending | |
| sabrina | ナツメ | ヤマブキジム | eterna-desert | — | pending | |
| morty | キョウ | セキチクジム | everstep | — | pending | |
| blaine | カツラ | グレンジム | la-amaranta | — | pending | |
| giovanni-3 | サカキ | トキワジム | la-amaranta | — | pending | §2.3「敵対組織」のサカキ（giovanni-1/2）と同一人物設定が現行の元ネタ。強いEtymon化するか、応援団の「推し」キャラ側に寄せるかは要決定（オープンクエスチョン、下記§4参照） |
| elite-lorelei | カンナ | セキエイ高原 | schwanburg-castle | — | pending | |
| elite-bruno | シバ | セキエイ高原 | schwanburg-castle | — | pending | |
| elite-agatha | キクコ | セキエイ高原 | schwanburg-castle | — | pending | |
| elite-lance | ワタル | セキエイ高原 | schwanburg-castle | — | pending | |
| champion-rival | ライバル | えいゆうのへや | schwanburg-castle | （対象外・人間のまま） | confirmed | ライバルは温存方針確定（§2.1）。最終決戦の相手として人間のまま据え置く |

## 2. 敵対組織（旧ロケット団）

方針（[`WORLD_STORY_GUIDE.md`](./WORLD_STORY_GUIDE.md) §2.2）：犯罪組織ではなく
「各地でUMAを探し歩いているサークル」。組織名・リーダー名は未確定。

UMA枠（モスマン＝onix／チュパカブラ＝hitmonlee／ユニコーン＝farfetchd／
イエティ＝yeti）の生息地に合わせて、各地の遭遇イベントとして再構成する想定。

| 内部ID | 現行（参考） | 所在地（現行・参考） | 新設定 | status | memo |
|---|---|---|---|---|---|
| （組織名） | ロケット団 | — | UMA探索サークル（名称未定） | pending | |
| （サークルのリーダー） | サカキ | — | サークルリーダー（名称未定） | pending | 上表 giovanni-1/2/3 のサカキと同一人物設定。「ZONE関門」側に置くか「サークルのリーダー」側に置くか、役割の重複を整理する必要あり |
| rocket-mt-moon | ムサシ＆コジロウ | おつきみやま | サークルメンバー | pending | |
| rocket-scout | ロケット団スカウト員 | 24ばんどうろ | サークルメンバー | pending | |
| rocket-thief | 泥棒ロケット団員 | ハナダシティ | サークルメンバー | pending | 「泥棒」という役柄は犯罪組織前提のため要再設定 |
| rocket-celadon | ムサシ＆コジロウ | タマムシ地下アジト | サークルメンバー | pending | 拠点（地下アジト）も要再設定。§3の「タマムシ地下アジト」参照 |
| giovanni-1 | サカキ | タマムシ地下アジト | サークルリーダー | pending | |
| rocket-tower | ロケット団員 | エティモンタワー最上階 | サークルメンバー | pending | |
| rocket-silph | ムサシ＆コジロウ | シルフカンパニー11かい | サークルメンバー | pending | 「企業占拠」プロットの代替が必要（§3参照） |
| giovanni-2 | サカキ | シルフカンパニー社長室 | サークルリーダー | pending | |

## 3. 地名・施設名

「地方」レベルの世界地理（habitatId）はすでに `ETYMON_NAMES.md` のhabitat列に
部分的に存在する（エルムリア／ほしのくもい／ウルトラブルー／オールドスモーク／
エテルナ砂漠／大流蛍楼宇／エバーステップ／アルバピーク／ラ・アマランタ／
タラシス海底神殿／カパドラ洞窟・地下帝国／シュヴァンブルク城）。下表はその中の
個別スポット（都市・施設・ルート）の独自名。

| 現行地名（参考・削除予定） | 種別 | habitatId | 独自案 | status | memo |
|---|---|---|---|---|---|
| オーキド研究所 | 開始地点の施設 | elmuria | — | pending | 博士→ナビ（まるいマスコット）というキャラ変更（`IP_CONCEPT.md`§5）と連動する施設名 |
| ニビジム | ZONE関門施設 | elmuria | — | pending | |
| 22ばんどうろ | ルート | elmuria | — | pending | |
| 24ばんどうろ | ルート | ultra-blue | — | pending | |
| ハナダシティ／ハナダジム | 街／ZONE関門施設 | everstep / old-smoke | — | pending | |
| サント・アンヌ号 | 移動施設（客船） | old-smoke | — | pending | |
| クチバジム | ZONE関門施設 | eterna-desert | — | pending | |
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

- **サカキ（giovanni-1/2/3）の役割重複**：現行は「敵対組織の首領」と「8番目の
  ZONEリーダー（トキワジム）」を兼任している。新設計では前者は「応援団の推し」、
  後者は「強いEtymon」という別方針になっており、そのままでは矛盾する。
  同一人物を推し測るのが構造としてWORLD_STORY_GUIDE.md §2.1に対する例外になる。
  一つに寄せるか、8番目のZONEだけ別ロジックにするかを次回決定する
- 敵対組織の拠点（タマムシ地下アジト／シルフカンパニー）をどう無害な形に
  作り直すか
