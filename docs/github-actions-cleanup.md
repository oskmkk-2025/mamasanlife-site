# GitHub Actions 整理手順（古いWorkflow/Secrets/権限の棚卸し）

最終更新: 2025-10-14

## 1) 現状の棚卸し（一覧取得）
- Workflows 一覧（GitHub CLI）
  - `gh workflow list`
  - `gh workflow view <name.yml> --yaml`
- 直近の実行状況
  - `gh run list --limit 50`
- Secrets/Variables 一覧
  - `gh secret list`（リポジトリ）
  - `gh secret list --env <Environment名>`（Environment単位）
  - `gh variable list`

## 2) 廃止候補の判定
- `.github/workflows/` にあるが最近の run が無い
- 同等の処理が別Workflowへ移管済み
- 旧ブランチ専用など、運用上の用途が消滅

## 3) 廃止/停止の進め方（安全運用）
- PRで削除（推奨）
  - 対象のYAMLを削除→`CHANGELOG`に理由を記載→レビュー→Merge
- 一時停止（様子見）
  - `gh workflow disable <name.yml>` → 1〜2週様子見 → 問題なければ削除

## 4) Secrets/Variables の整理
- ルール
  - “機密は Environment Secret へ”／本番デプロイ用は `production` Environment を使用
  - 未使用/重複/用途不明は削除（消す前に `gh secret view` で値の有無を確認）
- 作業
  - `gh secret list` で候補洗い出し → バックアップ（安全な保管先へ） → `gh secret delete <NAME>`

## 5) 権限の最小化（permissions）
- 既定で Read-Only、必要なJobだけ付与
- 例（リポジトリ既定）: `.github/workflows/_defaults.yml` に集約

```yaml
permissions:
  contents: read
  id-token: write # OIDCが必要な場合のみ
```

- 例（Job単位で昇格）

```yaml
jobs:
  deploy:
    permissions:
      contents: write
      deployments: write
```

## 6) Actionsのバージョン固定（サプライチェーン対策）
- 例: `actions/checkout@v4` ではなく commit SHA へ固定

```yaml
- uses: actions/checkout@3df4ab11eba7bda6032a0b82a6bb43b11571feac # v4.1.6
```

- Renovate/Dependabot で定期更新（PRでSHA更新）

## 7) 本番Environmentの保護
- “Environments > production”
  - Required reviewers を設定（2名以上推奨）
  - Secrets は Environment側にのみ置く
  - Branch protection: main に Require status checks + 必須レビュー

## 8) 追加のセキュリティ
- Secret Scanning / Push Protection を有効化（Settings > Code security）
- gitleaks を CI に導入（pre-commit でも）
- CodeQL（任意）

---

補足: 実リポジトリに合わせた固有名詞やEnvironment名は、このドキュメントに追記してください。

