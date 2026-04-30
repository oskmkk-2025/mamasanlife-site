# CTA Button Images

このディレクトリには、CTAボタンのAI生成PNG画像を配置します。
`CTAButton` コンポーネントの `useImage` プロパティを `true` にすると、
このディレクトリのPNGが next/image で表示されます。

## 必要なファイル

| ファイル名 | 用途 | サイズ |
|---|---|---|
| amazon.png | Amazonで見る | 1080×126px（@3x相当） |
| rakuten.png | 楽天市場で見る | 1080×126px |
| yahoo.png | Yahoo!ショッピングで見る | 1080×126px |
| kurashi.png | くらしのマーケットで見る | 1080×126px |
| study.png | スタディサプリで見る | 1080×126px |
| audiobook.png | audiobookで聴く | 1080×126px |

## 画像仕様

- **アスペクト比**: 約 8.57:1（横長カプセル型ボタン）
- **背景**: 完全透明（PNG透過）
- **サイズ**: 1080×126px（実表示は 360×42px、3倍の高解像度推奨）
- **形状**: 角丸カプセル（border-radius 50%相当の左右半円）
- **デザイン要素**:
  1. 各ブランドカラーの艶やかな単色グラデーション
  2. 上部に白い艶ハイライト
  3. 左端に白い円アイコン（ブランド色のシンボル入り）
  4. 中央に縦点線セパレーター
  5. ラベルテキスト（白・太字）
  6. 右端に白い円＋ブランド色「>」矢印

## 生成プロンプト

下記の `PROMPTS.md` を参照してください。Nano Banana / ChatGPT image generation 用の統一プロンプトを掲載しています。

## 使い方

```tsx
import CTAButton from '@/components/CTAButton'

// 画像モード（このディレクトリの amazon.png を使用）
<CTAButton type="amazon" url="https://amzn.to/..." useImage />

// CSSモード（フォールバック）
<CTAButton type="amazon" url="https://amzn.to/..." />
```
