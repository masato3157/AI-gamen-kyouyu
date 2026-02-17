# AI画面共有 (AI-gamen-kyouyu)

見ているWebページを、ワンクリックでAI（ChatGPT, Gemini, Claude, Antigravity）に共有するためのChrome拡張機能です。

## 機能
- **ワンクリック共有**: ボタンを押すだけで、スクリーンショットをクリップボードにコピーします。
- **自動タブ切り替え**: AIサービスのタブを自動で開き（または切り替え）、すぐに `Ctrl + V` で貼り付けられます。
- **Antigravity連携**: Antigravity（AIエージェント）のワークスペースに直接画像を保存することも可能です。

## インストール方法

### 1. リポジトリのクローン
```bash
git clone https://github.com/masato3157/AI-gamen-kyouyu.git
cd AI-gamen-kyouyu
```

### 2. 連携プログラムの登録 (Windows)
Antigravityへの直接送信機能を使う場合のみ必要です。
1.  `host` フォルダを開きます。
2.  `install_host.bat` をダブルクリックして実行します。

### 3. Chromeへの読み込み
1.  Chromeで `chrome://extensions` を開きます。
2.  右上の「デベロッパーモード」をONにします。
3.  「パッケージ化されていない拡張機能を読み込む」をクリックします。
4.  このリポジトリ内の `extension` フォルダを選択します。

## 使い方
1.  共有したいWebページを開きます。
2.  拡張機能アイコンをクリックします。
3.  送りたいAIサービス（例: ChatGPT）のボタンをクリックします。
4.  AIの画面が開くので、入力欄で `Ctrl + V` を押して画像を貼り付けます。

## ライセンス
MIT License
