// api/analyze.js - 2026 全能診斷版
export default async function handler(req, res) {
  // 1. 限制只能使用 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { data, type, mimeType, lang } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  // 2. 檢查 API Key 是否有設定
  if (!API_KEY) {
    console.error("錯誤：找不到 GEMINI_API_KEY 環境變數");
    return res.status(500).json({ error: '伺服器設定錯誤：缺少 API Key' });
  }

  try {
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    let promptContent;
    
    // 3. 根據傳入類型（文字或音訊）決定發送給 AI 的內容
    if (type === 'audio') {
      // 檔案模式：音訊 Base64 數據
      promptContent = [
        { text: `請聽這段錄音，先完整轉錄成文字放在 "_transcript" 欄位中，然後將內容解析為 JSON 格式（例如：{"日期":"xxx", "品項":"xxx"}）。請使用 ${lang} 進行回應，絕對不要有 Markdown 標籤。` },
        { inline_data: { mime_type: mimeType, data: data } }
      ];
    } else {
      // 即時說話模式：純文字
      promptContent = [
        { text: `將以下文字解析為精簡的 JSON 格式，自動偵測項目。請使用 ${lang} 回應：${data}` }
      ];
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: promptContent }] })
    });

    const result = await response.json();
    
    if (result.error) {
      console.error("Google API 報錯:", result.error.message);
      return res.status(500).json({ error: result.error.message });
    }

    // 4. 解析 AI 回傳的文字並轉為 JSON
    const aiResponse = result.candidates[0].content.parts[0].text;
    const jsonMatch = aiResponse.match(/\{.*\}/s);
    
    // 成功回傳 JSON 給前端
    return res.status(200).json(jsonMatch ? JSON.parse(jsonMatch[0]) : { content: aiResponse });

  } catch (error) {
    console.error("系統執行異常:", error.message);
    return res.status(500).json({ error: "系統錯誤: " + error.message });
  }
}
