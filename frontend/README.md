## Frontend (Next.js) Setup

チャット機能はバックエンド (`../backend`) と連携します。並行で起動してください。

```bash
# フロントエンド依存関係のインストール
cd frontend
npm install

# 既定では http://localhost:4000/api/chat を参照
# 別ポートで起動する場合は環境変数を設定
export NEXT_PUBLIC_FARMER_CHAT_API_BASE="http://localhost:4000/api/chat"

# 開発サーバー
npm run dev

# バックエンドも同時に起動する場合（backend 側スクリプト）
npm --prefix ../backend run dev:all
```

## Shared Types

- `backend/src/types/chat.ts` の型定義を `npm --prefix backend run sync-types` で
  `frontend/src/shared-types/backend/chat.ts` に同期できます。
- アプリ側では `@/shared-types/chat` を経由してバックエンド型を参照します。

## チャット機能のポイント

- 農家 ID は `AuthContext` のログイン利用者 ID（未ログイン時は `farmer-001`）を使用します。
- DM 作成、グループ作成、一斉送信は `FarmerDashboard` の「チャット・連絡」タブに集約しました。
- 送信完了後は自動的にスレッドを再描画し、未読数バッジを更新します。

## 開発時のメモ

- UI は Chakra UI を利用しています。スタイルは `FarmerChatCenter` コンポーネント内で管理しています。
- Thunder Client / VS Code REST Client 用のリクエストサンプルは `../backend/docs/chat-api-samples.http` を参照してください。
- `NEXT_PUBLIC_FARMER_CHAT_API_BASE` を変更することでモックから本番 API へ切り替えられます。
