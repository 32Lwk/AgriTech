# Farmer Chat Backend

Express + TypeScript 製のモックバックエンドです。農家ダッシュボード用のチャット・DM・グループ連絡機能を提供します。

## セットアップ

```bash
cd backend
npm install
# フロントエンドで型を共有したい場合
npm run sync-types
```

## 開発サーバーの起動

```bash
# API サーバーのみ起動 (http://localhost:4000)
npm run dev

# フロントエンド(../frontend)と同時起動
npm run dev:all
```

`npm run dev:all` は `npx concurrently` を利用して `backend` と `frontend` の開発サーバーを同時に起動します。

ビルド後の実行は以下です。

```bash
npm run build
npm start
```

## 主要エンドポイント

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/health` | ヘルスチェック |
| GET | `/api/chat/opportunities?farmerId=farmer-001` | 農家が管理する案件と参加者一覧 |
| GET | `/api/chat/threads?farmerId=farmer-001&includeClosed=false` | チャットスレッド一覧 |
| GET | `/api/chat/threads/:threadId?farmerId=farmer-001` | 指定スレッドの詳細とメッセージ履歴 |
| POST | `/api/chat/threads/dm` | 応募者との DM スレッドを新規作成 | 
| POST | `/api/chat/threads/group` | 案件参加者とのグループスレッドを作成 |
| POST | `/api/chat/threads/:threadId/messages?farmerId=farmer-001` | メッセージ送信 |
| POST | `/api/chat/threads/:threadId/read` | 既読状態の更新 |
| POST | `/api/chat/opportunities/:opportunityId/broadcast` | 案件参加者全員への一斉送信 |

各リクエストボディのスキーマは `src/types/chat.ts`（`zod` ベース）を参照してください。`npm run sync-types` 実行後は `frontend/src/shared-types/backend/chat.ts` に同期されます。

## サンプルリクエスト

`docs/chat-api-samples.http` に Thunder Client / VS Code REST Client 互換のサンプルリクエストを用意しています。必要に応じて `farmerId` や `opportunityId` を差し替えてください。
