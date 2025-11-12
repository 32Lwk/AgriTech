# AgriTech プラットフォーム

農家・就農希望者・運営向けのダッシュボード体験を検証するためのモノリポジトリです。  
フロントエンドは Next.js + Chakra UI、バックエンドは Express + TypeScript で実装されており、チャット機能を中心にモックデータと地図リソースを組み合わせて動作します。

## ディレクトリ構成

```text
.
├── backend/    # Express ベースのチャット用モック API サーバー
├── frontend/   # Next.js 製ダッシュボード UI（農家/ワーカー/管理者）
└── date/       # 豊橋市周辺の地図・資料（GML, PDF）
```

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


