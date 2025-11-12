# AgriTech プラットフォーム

農家・就農希望者・運営向けのダッシュボード体験を検証するためのモノリポジトリです。  
フロントエンドは Next.js + Chakra UI、バックエンドは Express + TypeScript で実装されており、チャット機能を中心にモックデータと地図リソースを組み合わせて動作します。

## ディレクトリ構成
リポジトリ全体をツリーと詳細説明の 2 段構えで整理しています。

### 全体ツリー
```text
AgriTech/
├── .gitignore
├── README.md
├── backend/
│   ├── .eslintrc.cjs
│   ├── README.md
│   ├── docs/
│   │   └── chat-api-samples.http
│   ├── package-lock.json
│   ├── package.json
│   ├── scripts/
│   │   └── sync-types.js
│   ├── src/
│   │   ├── app.ts
│   │   ├── controllers/
│   │   │   └── chatController.ts
│   │   ├── middleware/
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   └── chatRoutes.ts
│   │   ├── server.ts
│   │   ├── services/
│   │   │   └── chatService.ts
│   │   ├── store/
│   │   │   ├── chatStore.ts
│   │   │   └── mockData.ts
│   │   ├── types/
│   │   │   └── chat.ts
│   │   └── utils/
│   │       └── httpError.ts
│   └── tsconfig.json
├── date/
│   ├── geojson/
│   │   ├── agri201523201.gml
│   │   ├── agri202023201.gml
│   │   └── r2ka23201.gml
│   └── 全体図.pdf
└── frontend/
    ├── .eslintrc.json
    ├── .gitignore
    ├── README.md
    ├── next.config.mjs
    ├── package-lock.json
    ├── package.json
    ├── public/
    │   ├── file.svg
    │   ├── globe.svg
    │   ├── next.svg
    │   ├── vercel.svg
    │   └── window.svg
    ├── scripts/
    │   ├── checkOpportunityLocations.js
    │   ├── debugFarmland.js
    │   ├── exportToyohashiBoundary.js
    │   ├── restoreOpportunityLocations.js
    │   └── updateOpportunityLocations.js
    ├── src/
    │   ├── app/
    │   │   ├── dashboard/
    │   │   │   └── [role]/
    │   │   │       └── page.tsx
    │   │   ├── favicon.ico
    │   │   ├── globals.css
    │   │   ├── layout.tsx
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   ├── page.tsx
    │   │   └── providers.tsx
    │   ├── components/
    │   │   ├── dashboard/
    │   │   │   └── DashboardContainer.tsx
    │   │   ├── layout/
    │   │   │   ├── AppShell.tsx
    │   │   │   ├── DashboardHeader.tsx
    │   │   │   └── SidebarNav.tsx
    │   │   ├── map/
    │   │   │   ├── LeafletMap.tsx
    │   │   │   └── LeafletMapInner.tsx
    │   │   ├── navigation/
    │   │   │   └── BottomNavigation.tsx
    │   │   └── ui/
    │   │       └── StatCard.tsx
    │   ├── constants/
    │   │   └── profile.ts
    │   ├── data/
    │   │   └── toyohashiBoundary.ts
    │   ├── features/
    │   │   ├── auth/
    │   │   │   ├── AuthContext.tsx
    │   │   │   └── types.ts
    │   │   ├── dashboard/
    │   │   │   ├── admin/
    │   │   │   │   └── AdminDashboard.tsx
    │   │   │   ├── components/
    │   │   │   │   └── DashboardHeader.tsx
    │   │   │   ├── farmer/
    │   │   │   │   ├── FarmerDashboard.tsx
    │   │   │   │   ├── api/
    │   │   │   │   │   └── chat.ts
    │   │   │   │   └── components/
    │   │   │   │       └── FarmerChatCenter.tsx
    │   │   │   └── worker/
    │   │   │       └── WorkerDashboard.tsx
    │   │   ├── opportunities/
    │   │   │   └── types.ts
    │   │   └── profile/
    │   │       └── ProfileEditorModal.tsx
    │   ├── mock-data/
    │   │   ├── exchangeVenues.ts
    │   │   ├── metrics.ts
    │   │   └── opportunities.ts
    │   ├── shared-types/
    │   │   ├── backend/
    │   │   │   └── chat.ts
    │   │   └── chat.ts
    │   ├── theme/
    │   │   └── index.ts
    │   └── utils/
    │       ├── file.ts
    │       └── geospatial.ts
    └── tsconfig.json
```

### ファイル詳細
- **ルート**
  - `.gitignore` — Node.js／Next.js の依存物やビルド成果物を除外する設定。
  - `README.md` — 本ドキュメント。
- **backend/**
  - `.eslintrc.cjs` — ESLint 設定。
  - `README.md` — バックエンドのセットアップと API 説明。
  - `docs/`
    - `chat-api-samples.http` — Thunder Client / VS Code REST Client 用のサンプルリクエスト。
  - `package.json` / `package-lock.json` — 依存関係と NPM スクリプト定義。
  - `scripts/`
    - `sync-types.js` — 型定義をフロントエンドへコピーするスクリプト。
  - `src/`
    - `app.ts` — Express アプリの初期化とミドルウェア設定。
    - `controllers/`
      - `chatController.ts` — ルートごとのリクエストハンドラ。
    - `middleware/`
      - `errorHandler.ts` — 404/共通エラーハンドラ。
    - `routes/`
      - `chatRoutes.ts` — `/api/chat` 配下のルーティング。
    - `server.ts` — HTTP サーバーの起動エントリ。
    - `services/`
      - `chatService.ts` — ビジネスロジック。スレッド作成やメッセージ処理を担当。
    - `store/`
      - `chatStore.ts` — インメモリデータ操作・既読計算・スレッド管理。
      - `mockData.ts` — 農家・応募者・案件・メッセージなどのモックデータ。
    - `types/`
      - `chat.ts` — API 入出力定義と Zod スキーマ。
    - `utils/`
      - `httpError.ts` — HTTP エラー生成ユーティリティ。
  - `tsconfig.json` — TypeScript コンパイル設定。
- **date/**
  - `geojson/`
    - `agri201523201.gml` — 農地関連 GML データ（2015 年度）。
    - `agri202023201.gml` — 農地関連 GML データ（2020 年度）。
    - `r2ka23201.gml` — 行政区画 GML データ。
  - `全体図.pdf` — プロジェクト全体像の PDF 資料。
- **frontend/**
  - `.eslintrc.json` — ESLint 設定。
  - `.gitignore` — Next.js 向けの除外パターン。
  - `README.md` — フロントエンドのセットアップメモ。
  - `next.config.mjs` — Next.js 設定。
  - `package.json` / `package-lock.json` — 依存関係と NPM スクリプト。
  - `public/`
    - `file.svg` — UI 用アイコン。
    - `globe.svg` — UI 用アイコン。
    - `next.svg` — UI 用アイコン。
    - `vercel.svg` — UI 用アイコン。
    - `window.svg` — UI 用アイコン。
  - `scripts/`
    - `checkOpportunityLocations.js` — 案件位置の検証スクリプト。
    - `debugFarmland.js` — 農地データのデバッグ補助スクリプト。
    - `exportToyohashiBoundary.js` — 豊橋市の境界データをエクスポート。
    - `restoreOpportunityLocations.js` — 案件位置データの復元。
    - `updateOpportunityLocations.js` — 案件位置データの更新。
  - `src/`
    - `app/`
      - `dashboard/`
        - `[role]/`
          - `page.tsx` — ロール別ダッシュボードのルーティングページ。
      - `favicon.ico` — アプリのファビコン。
      - `globals.css` — グローバルスタイル。
      - `layout.tsx` — アプリ全体のレイアウト。
      - `login/`
        - `page.tsx` — ログインページ。
      - `page.tsx` — ルートページ。
      - `providers.tsx` — Chakra UI などのグローバルプロバイダー設定。
    - `components/`
      - `dashboard/`
        - `DashboardContainer.tsx` — ダッシュボードのレイアウトコンテナ。
      - `layout/`
        - `AppShell.tsx` — 共通レイアウト枠。
        - `DashboardHeader.tsx` — ダッシュボードヘッダー。
        - `SidebarNav.tsx` — サイドナビゲーション。
      - `map/`
        - `LeafletMap.tsx` — Leaflet マップのラッパー。
        - `LeafletMapInner.tsx` — Leaflet マップの詳細実装。
      - `navigation/`
        - `BottomNavigation.tsx` — モバイル下部ナビゲーション。
      - `ui/`
        - `StatCard.tsx` — KPI 表示カードコンポーネント。
    - `constants/`
      - `profile.ts` — プロファイル関連定数。
    - `data/`
      - `toyohashiBoundary.ts` — 豊橋市境界の座標データ。
    - `features/`
      - `auth/`
        - `AuthContext.tsx` — 認証ステートとモックユーザー管理。
        - `types.ts` — 認証関連型定義。
      - `dashboard/`
        - `admin/`
          - `AdminDashboard.tsx` — 管理者ダッシュボード。
        - `components/`
          - `DashboardHeader.tsx` — ダッシュボード共通ヘッダー。
        - `farmer/`
          - `FarmerDashboard.tsx` — 農家ダッシュボード。
          - `api/`
            - `chat.ts` — 農家向けチャット API クライアント。
          - `components/`
            - `FarmerChatCenter.tsx` — 農家チャット UI の中核。
        - `worker/`
          - `WorkerDashboard.tsx` — ワーカーダッシュボード。
      - `opportunities/`
        - `types.ts` — 案件関連型。
      - `profile/`
        - `ProfileEditorModal.tsx` — プロフィール編集モーダル。
    - `mock-data/`
      - `exchangeVenues.ts` — 交換拠点のモックデータ。
      - `metrics.ts` — 指標モックデータ。
      - `opportunities.ts` — 案件モックデータ。
    - `shared-types/`
      - `backend/`
        - `chat.ts` — バックエンドと同期したチャット型定義。
      - `chat.ts` — フロントエンド内共通チャット型。
    - `theme/`
      - `index.ts` — Chakra UI テーマ設定。
    - `utils/`
      - `file.ts` — ファイル操作ユーティリティ。
      - `geospatial.ts` — 地理座標処理ユーティリティ。
  - `tsconfig.json` — TypeScript 設定。

## 必要要件

- Node.js 20 以降（LTS 推奨）
- npm 10 以降

## セットアップ手順

```bash
git clone https://github.com/32Lwk/AgriTech.git
cd AgriTech

# 依存関係のインストール
npm --prefix backend install
npm --prefix frontend install
```

## バックエンド（`backend/`）

- `npm run dev` : http://localhost:4000 で開発用サーバーを起動
- `npm run build && npm start` : 本番想定ビルドと実行
- `npm run dev:all` : `concurrently` を使ってバックエンドとフロントエンドを同時起動
- `npm run sync-types` : 型定義を `frontend/src/shared-types/backend/` にコピー
- 主要エンドポイントとリクエスト例は `backend/docs/chat-api-samples.http` を参照

チャット関連 API は全て `backend/src/types/chat.ts` の Zod スキーマでバリデーションされます。データは `backend/src/store/mockData.ts` のインメモリ構造を利用し、DM・グループ・一斉連絡スレッド、既読管理、案件参加者一覧などを提供します。

### エンドポイント一覧（抜粋）

| Method | Path | 説明 |
| ------ | ---- | ---- |
| GET | `/health` | ヘルスチェック |
| GET | `/api/chat/opportunities?farmerId=farmer-001` | 農家が管理する案件と参加者一覧 |
| GET | `/api/chat/threads?farmerId=farmer-001&includeClosed=false` | チャットスレッド一覧 |
| GET | `/api/chat/threads/:threadId?farmerId=farmer-001` | メッセージ履歴と詳細 |
| POST | `/api/chat/threads/dm` | 応募者との DM スレッド作成 |
| POST | `/api/chat/threads/group` | 案件参加者とのグループスレッド作成 |
| POST | `/api/chat/threads/:threadId/messages?farmerId=farmer-001` | メッセージ送信 |
| POST | `/api/chat/threads/:threadId/read` | 既読状態の更新 |
| POST | `/api/chat/opportunities/:opportunityId/broadcast` | 案件参加者全員への一斉送信 |

## フロントエンド（`frontend/`）

- `npm run dev` : http://localhost:3000 で開発用 Next.js サーバーを起動
- `npm run build && npm start` : 本番ビルドと起動
- Chakra UI と React Hook Form を利用したダッシュボード UI、Leaflet ベースの地図、Farmer Dashboard のチャットセンターなどを実装

環境変数:

```bash
# 既定値は http://localhost:4000/api/chat
export NEXT_PUBLIC_FARMER_CHAT_API_BASE="http://localhost:4000/api/chat"
```

フロントエンドからは `frontend/src/features/dashboard/farmer/components/FarmerChatCenter.tsx` を中心にチャット API を呼び出します。ログインコンテキスト（`frontend/src/features/auth/AuthContext.tsx`）内のモックユーザーで認証状態を切り替え可能です。

### モックユーザー（代表例）

- 農家: `farmer@example.com / password123`
- ワーカー: `worker@example.com / password123`
- 管理者: `admin@example.com / password123`

## 型の共有

バックエンドの型をフロントで参照する場合は、以下を実行してください。

```bash
npm --prefix backend run sync-types
```

`backend/src/types/*.ts` が `frontend/src/shared-types/backend/` にコピーされ、`@/shared-types/chat` からインポートできます。

## モックデータと地図リソース

- `frontend/src/mock-data/` : 案件、参加者、指標などの大量モックデータ
- `frontend/scripts/*.js` : 案件位置の検証や地図エクスポートなど開発補助スクリプト
- `date/geojson/*.gml` : 豊橋市周辺の地理情報（GML）
- `date/全体図.pdf` : プロジェクト全体像の資料

## 開発時のヒント

- REST クライアント用リクエストは `backend/docs/chat-api-samples.http` を VS Code REST Client や Thunder Client で読み込めます。
- UI カスタマイズは Chakra UI コンポーネント、地図は `frontend/src/components/map/LeafletMapInner.tsx` を起点に調整します。
- `npm --prefix backend run dev:all` を使うと、バックエンドとフロントエンドを同時に起動してチャットの疎通確認が容易になります。

## ライセンス

現時点で OSS ライセンスは明記されていません。必要に応じてプロジェクト方針に合わせて追加してください。


