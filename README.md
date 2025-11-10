# 農家×学生マッチング UX デモアプリ

短期間で「農家×学生×運営」の価値交換シナリオを体験できるように構築した Flutter 製デモアプリです。実運用機能（決済・本格認証・外部通知など）はモック化し、UX とストーリーテリングに集中しています。

## 主な体験導線

- **ゲストログイン**：ペルソナカードから匿名ログイン。SNS ログインは演出のみ。
- **募集検索・応募**：ローカル JSON から募集カードを表示し、キーワード/タグ/都道府県フィルタが可能。
- **承認通知 & チャット**：応募後に擬似承認が自動付与され、チャットスレッドに通知が届く。
- **チェックイン & 作業完了**：QR/GPS を想定した擬似チェックイン、作業完了でマイルが付与。
- **マイル可視化**：`fl_chart` によるマイル推移グラフ、履歴一覧表示。
- **スタジオ予約**：`TableCalendar` で枠選択し、予約完了トースト＆ローディング演出。
- **フォトログ**：作業写真（ダミー URL）とメモを追加して成果を視覚化。
- **チュートリアル**：ペルソナ別ガイドを PageView で表示。

デモ進行の詳細は `docs/demo_runbook.md` を参照してください。

## 技術スタック

- Flutter 3 / Dart 3
- 状態管理：`provider`
- UI：Material 3 テーマ、`fl_chart`、`table_calendar`
- Map：`google_maps_flutter`（lite モード）
- Backend 代替：ローカル JSON（`assets/mock/`）
- Firebase Auth：匿名ログインをモック（`firebase_auth` / `firebase_core` をインポート済み）

## ディレクトリ構成

```
assets/mock/        # 募集・マイル・予約・チャットのモック JSON
docs/               # UX 設計資料・デモ台本
lib/
  app.dart          # アプリエントリ・テーマ適用
  main.dart         # runApp
  data/             # モデルとモックリポジトリ
  screens/          # 画面群（ホーム/詳細/チャット/マイル/予約/マイページ など）
  state/            # AppState（モックデータ読込・状態遷移）
  theme/            # Material 3 テーマ設定
  widgets/          # 共通 UI（地図プレビューなど）
```

## セットアップ

1. Flutter 3.16 以降をインストール（`flutter --version` で確認）。
2. 依存関係の取得：
   ```sh
   flutter pub get
   ```
3. Google Maps API キーを取得し、`android/app/src/main/AndroidManifest.xml` と `ios/Runner/AppDelegate.swift`（または `Info.plist`）へ設定。デモのみの場合は未設定でも動作しますが、地図がグレー表示になります。

### Firebase 設定（任意）

匿名ログイン演出のみのため設定は必須ではありません。実機で Firebase 初期化を行う場合は `flutterfire configure` で生成される `firebase_options.dart` を `lib/` に配置し、`main.dart` で `Firebase.initializeApp` を呼び出してください。

## 実行方法

```sh
flutter run
```

Web/モバイルの両方で動作します。デモ環境ではゲストログイン→ホーム→募集詳細→チャット→チェックイン→マイル→予約→マイページの順に操作すると、価値交換ストーリーが確認できます。

## スクリプト・推奨コマンド

- 静的解析：
  ```sh
  flutter analyze
  ```
- テスト（現状サンプルなし）：
  ```sh
  flutter test
  ```

## 今後の拡張想定

- 決済・本人確認：外部サービス（Stripe、eKYC）連携
- RBAC・データ永続化：Firestore／Cloud Functions との統合
- 実通知：Firebase Cloud Messaging / SendGrid / Twilio
- バックアップ・セキュリティ：自動バックアップと監査ログ

## ライセンス

本リポジトリはデモ用途での利用を想定しています。商用利用・再配布を行う場合は別途ご相談ください。

