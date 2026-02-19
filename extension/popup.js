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

// 2. スクリーンショットをコピー
document.getElementById('btnCopy').addEventListener('click', async () => {
    const btn = document.getElementById('btnCopy');
    btn.disabled = true;
    showStatus('コピー中...', '');

    try {
        // スクリーンショット撮影
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

        // クリップボードへコピー
        const success = await copyToClipboard(dataUrl);

        if (success) {
            showStatus('コピーしました！', 'success');
            // ユーザーへのフィードバック時間を確保してから閉じる
            setTimeout(() => window.close(), 1000);
        } else {
            throw new Error('クリップボードへのコピーに失敗しました');
        }

    } catch (err) {
        showStatus('エラー: ' + err.message, 'error');
        btn.disabled = false;
    }
});
