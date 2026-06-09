# CLAUDE.md

## プロジェクト概要

**WealthForward** — 個人向け生涯資産シミュレーター。
スプレッドシート感覚で収入・支出を年ごとに入力し、25〜50年の純資産推移を可視化する。

### コンセプト
- **操作はシンプル**: スプレッドシートと同じくらい簡単
- **UIはcool**: アニメーション・ダークテーマで差別化
- **バックエンドなし**: ブラウザ完結 (IndexedDB)

## Tech Stack

| 層 | 技術 |
|---|---|
| Framework | Vite + React 19 + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui conventions |
| Animation | Framer Motion |
| Chart | Recharts |
| Storage | IndexedDB (Dexie) |
| Deploy | Cloudflare Pages → wf.solocamp.work |

## 開発コマンド

```bash
npm run dev       # Vite dev server
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

## ディレクトリ構成

```
src/
├── components/
│   ├── layout/        # AppShell, header, nav
│   ├── simulation/    # YearGrid, SimChart, SettingsView
│   └── ui/            # AnimatedNumber, shadcn components
├── hooks/             # useSimulation
├── lib/
│   ├── types.ts       # Simulation, Category, FamilyMember
│   ├── engine.ts      # Pure simulation calculation
│   ├── db.ts          # Dexie IndexedDB CRUD
│   └── utils.ts       # cn(), formatYen(), formatMan()
├── App.tsx
└── main.tsx
```

## データモデル

```
Simulation
├── family: FamilyMember[] (name + birthYear → age auto-calc)
├── income: Category[]     (label + amounts per year)
└── costs: Category[]      (label + amounts per year)
```

計算: `年ごとの net = Σincome - Σcosts → 累積 = running sum`

## コーディング規約

- 日本語で応答、コードコメントは英語
- コンポーネントは関数コンポーネント + hooks
- 状態管理は React state + custom hooks (外部ストアなし)
- アニメーションは Framer Motion の `motion.*` で統一
- 色はCSS変数 (--primary, --positive, --negative etc.) 経由
- フォーマットは `prettier` (設定があれば) or Vite default

## 明示的スコープ外

- バックエンド / サーバーサイド処理
- 認証 (個人端末でブラウザ保存)
- CSV インポート / 金融機関連携
- ローン金利計算 (v1)
- マルチユーザー
