# dsh-locale-ja 技術詳細

このドキュメントは dsh-locale-ja パッケージの技術的詳細を説明します。一般ユーザーは README を参照してください。

## パッケージ内容

- DSH 0.2.1-rc.2 の英語スナップショット: 64 名前空間 / 2906 キー（変更不可）
- 日本語訳: 83 値はモバイルパックから移行、残り 2823 値は 94 バッチでレビュー済み
- 生成ファイル: package.json, index.js, client.js, locale/batches.json, locale/translation-status.json
- ビルドツール: tools/build-client.mjs, tools/merge-batches.mjs

## 所有権と移行 (#80)

このパッケージは日本語（ja）の唯一の所有者です。dsh-mobile-maxxing はもはや言語を登録せず、COPY.ja は自身の UI 文案のみ。

- このパッケージ無しでは en/zh のみ
- 両方入れても競合しない（モバイル側は addLanguage を呼ばない）
- デスクトップは無効（no-op）

## カタログの利用方法

モバイルプラグインはカタログを読むだけで、所有しない：

- レビュー済みラベルを使用（推測ではない）
- 遅れて有効化されても追随する（locale/change + subscribe）
- ホストのサイレント切替は既知の制限（resolveActive() を読み取り専用で使用）
- ボックス化された revision は投影のショートカット（Object(125)）

## インストール

このパッケージはモバイル tarball に含まれず、自動では有効になりません。

```sh
dsh plugin --profile web add kuraneko1/dsh-locale-ja
```

DSH を再起動して読み込み。

## ディレクトリ構成

```
package.json                 locale/package-meta.json から生成
index.js                     生成されたホスト半分（意図的に空）
client.js                    生成されたブラウザ半分（ローダー登録）
locale/
  upstream.json              ステージ1: 所有権、ソース、ハッシュ、キー数
  package-meta.json          生成マニフェストのソース
  batches.json               生成されたバッチマニフェスト
  translation-status.json    生成された完全/不完全の集計
  namespaces/en/*.json       ステージ1英語スナップショット（読み取り専用）
  namespaces/ja/*.json       レビュー済み日本語値（64ファイル）
test/
  extract-upstream.test.mjs  ステージ1抽出・再現性テスト
  stage2.test.mjs            生成、所有権、パリティ、完全性、マージテスト
  distribution.test.mjs      npm pack / インストール smoke、exports、dispose テスト
  client-loader.mjs          ブラウザローダーハーネス
  fixtures/seed-ja-83.json   不変の83値移行証拠と SHA-256
LICENSE                      MIT ライセンス + アップストリーム著作権
NOTICE                       アップストリーム帰属通知
work/                        ローカルバッチ入出力（gitignore、非出荷）
```

## 生成方法

リポジトリルートから:

```sh
node tools/build-client.mjs           # 5つの生成ファイルを再生成
node tools/build-client.mjs --check   # 生成ファイルが古い場合は exit 1
```

生成ファイルは手動で編集しない。ジェネレータは英語スナップショットと日本語ソースを読み、ハッシュ、キーセット、重複、空値、プレースホルダーを検証してから書き込む。

## バッチ翻訳ワークフロー

locale/batches.json がすべての英語キーを1つのバッチに割り当てる。各バッチは id、名前空間、sourceHash、キーリストを持つ。

ワーカーは work/out/<batch-id>.json のみを書く:

```json
{
  "schemaVersion": 1,
  "batch": "approval-01",
  "namespace": "approval",
  "sourceHash": "sha256:...",
  "values": {
    "approve": "承認",
    "reject": "拒否"
  }
}
```

values はバッチのキーリストと完全一致する必要がある（不足・余剰なし、空値は英語が空の場合のみ、プレースホルダー名も一致）。

レビューアは work/reviewed.json にレビューしたバッチハッシュを記録:

```json
{
  "schemaVersion": 1,
  "reviewed": {
    "approval-01": "sha256:..."
  }
}
```

その後、リポジトリルートから:

```sh
node tools/merge-batches.mjs --check   # レビュー済みバッチを検証、書き込みなし
node tools/merge-batches.mjs           # locale/namespaces/ja を原子更新
node tools/build-client.mjs            # client と status を再生成
node --test packages/dsh-locale-ja/test/stage2.test.mjs
```

マージは work/reviewed.json にあるバッチのみ受け付ける。古いハッシュ、名前空間違い、キー不足・余剰、非空英語の空値、プレースホルダー変更を拒否。すべてのレビュー済みバッチを検証してから最初の書き込みを行う。書き込みは一時ファイルのリネーム。英語スナップショットは書き込み対象外。

## ステータスと制限

- パッキングゲート: translation-status.json が完全（64/2906、フォールバック0）の場合のみ tarball を作成
- 現在のカバレッジ（2026-10-26）: complete、0 フォールバック
- フォールバックはテスト/開発専用
- このパッケージのみが ja を所有
- オプションで自動インストールされない
- ローダーは隔離済み、実機未検証
- バッチサイズ: 40キー以上は40-50キー chunks、未満は1バッチ

## 意図的に未翻訳の値（許可リスト）

完全なカタログでも、いくつかは意図的に英語のまま:

- command.token.{compact,export,feedback,goal,permission,plan}: トークンエイリアスが en/zh のみ
- settings.account.onboardingArtworkLocale: アートワークが en/zh のみ
- chat.message.stepProcess.sharedPrefix 等: 意図的に空白
- schedule.catalog.time.locale / schedule.manager.time.locale: Intl ロケール ID

## ステージ1: 英語スナップショットと抽出ツール

ステージ1ツールはアップストリーム英語辞書と各名前空間のソースを記録する。翻訳は行わない。

```sh
# デフォルト: $DSH_HOME/runtime or ~/.dsh/runtime
node tools/extract-upstream.mjs

# 明示的なルート
node tools/extract-upstream.mjs --dsh-root ~/.dsh/runtime

# コミット済みスナップショットと比較（差分があれば exit 1）
node tools/extract-upstream.mjs --check
```

locale/upstream.json は schemaVersion、snapshotLocale、dsh バージョン、合計、各名前空間の fileName、owners、sources、sourceHash、locales、keyCounts、dictionaryHashes を含む。タイムスタンプなし（決定的）。

パーサーは acorn を使用（Node 同梱、プロジェクトローカル、/usr/share/nodejs/acorn の順）。依存追加なし。

新しい DSH rc がインストールされたら: 抽出 → 差分レビュー → バッチで日本語更新 → build-client.mjs → テスト実行。

## テスト

```sh
node --test packages/dsh-locale-ja/test/*.test.mjs
# or
pnpm test:locale
```

stage2.test.mjs: 単一所有権、64登録、不変シード、en/ja パリティ、完全/不完全、意図的空白、プレースホルダー保持、重複チェック、バッチカバレッジ、レビューマージ、生成チェック、work/ の gitignore。

distribution.test.mjs: npm pack、exports、work/ 非出荷、dispose、パッキングゲート。
