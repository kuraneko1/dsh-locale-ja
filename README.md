# dsh-locale-ja

DSH（DeepSeek Harness）の日本語化パッケージ。[dsh-mobile-maxxing](https://github.com/kuraneko1/dsh-mobile-maxxing)と組み合わせて使います。

## なぜ必要か

DSH のモバイル版はデフォルトで英語・中国語のみ。このパッケージを入れると日本語表示が追加されます。
DSH 0.2.1-rc.3 の 65 名前空間・2915 キーに対応し、英語へのフォールバックはありません。

## インストール

```sh
dsh plugin --profile web add github:kuraneko1/dsh-locale-ja
```

DSH を再起動して反映。

## 詳細

技術的詳細・翻訳ワークフロー・テスト方法は [DETAILS.md](DETAILS.md) を参照。
