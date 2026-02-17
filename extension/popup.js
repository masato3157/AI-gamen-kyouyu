// popup.js

// ユーティリティ: ステータス表示
function showStatus(msg, type) {
    const el = document.getElementById('status');
    if (el) {
        el.textContent = msg;
        el.className = type;
    }
}

// ユーティリティ: 画像(DataURL)をクリップボードにコピー
async function copyToClipboard(dataUrl) {
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        // Clipboard API を使用
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        return true;
    } catch (err) {
        console.error('Clipboard error:', err);
        return false;
    }
}

// ユーティリティ: 指定URLのタブを探して切り替える、なければ新規作成
async function openOrSwitchTab(targetUrl, urlPattern) {
    // urlPattern に一致するタブを探す (例: *://gemini.google.com/*)
    const tabs = await chrome.tabs.query({ url: urlPattern });

    if (tabs.length > 0) {
        // 見つかったら、そのタブをアクティブにする
        const tab = tabs[0];
        await chrome.tabs.update(tab.id, { active: true });
        // そのウィンドウもフォーカスする
        await chrome.windows.update(tab.windowId, { focused: true });
    } else {
        // 見つからなければ、新しいタブで開く
        await chrome.tabs.create({ url: targetUrl });
    }
}

// --- ボタンごとの処理 ---

// 1. Antigravity へ送る (既存機能)
document.getElementById('btnAntigravity').addEventListener('click', async () => {
    const btn = document.getElementById('btnAntigravity');
    btn.disabled = true;
    showStatus('送信中...', '');

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        // スクリーンショット撮影
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

        // Native Messaging Hostへ送信
        chrome.runtime.sendNativeMessage(
            'com.antigravity.bridge',
            {
                image: dataUrl,
                url: tab.url,
                title: tab.title
            },
            (response) => {
                if (chrome.runtime.lastError) {
                    showStatus('エラー: ' + chrome.runtime.lastError.message, 'error');
                    btn.disabled = false;
                } else if (response && response.status === 'success') {
                    showStatus('送信成功！', 'success');
                    setTimeout(() => window.close(), 1500);
                } else {
                    showStatus('エラー: ' + (response ? response.message : '不明なエラー'), 'error');
                    btn.disabled = false;
                }
            }
        );
    } catch (err) {
        showStatus('エラー: ' + err.message, 'error');
        btn.disabled = false;
    }
});

// 2. ChatGPT へ送る
document.getElementById('btnChatGPT').addEventListener('click', async () => {
    await handleAiServiceClick('https://chatgpt.com/', '*://chatgpt.com/*');
});

// 3. Gemini へ送る
document.getElementById('btnGemini').addEventListener('click', async () => {
    await handleAiServiceClick('https://gemini.google.com/app', '*://gemini.google.com/*');
});

// 4. Claude へ送る
document.getElementById('btnClaude').addEventListener('click', async () => {
    await handleAiServiceClick('https://claude.ai/new', '*://claude.ai/*');
});

// 共通ハンドラ: AIサービス向け (撮影 -> コピー -> タブ切替)
async function handleAiServiceClick(targetUrl, urlPattern) {
    showStatus('コピー中...', '');

    try {
        // スクリーンショット撮影
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

        // クリップボードへコピー
        const success = await copyToClipboard(dataUrl);
        if (!success) {
            throw new Error('クリップボードへのコピーに失敗しました');
        }

        showStatus('コピー完了！ タブを開きます...', 'success');

        // タブ切り替えまたは新規作成
        await openOrSwitchTab(targetUrl, urlPattern);

        // ポップアップを閉じる (UX向上のため)
        // window.close(); 

    } catch (err) {
        showStatus('エラー: ' + err.message, 'error');
    }
}
