// api/analyze.js - 2026 最終穩定版
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { data, type, mimeType, lang } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  try {
    // 💡 修正點：使用正式版 v1，並切換到絕對穩定的 gemini-pro 模型
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    let promptText = "";
    if (type === 'audio') {
      promptText = `這是從錄音轉錄的內容，請解析為 JSON 格式（例如：{"日期":"xxx", "品項":"xxx"}）。請使用 ${lang} 回應，不要有 Markdown 標籤。內容為：${data}`;
    } else {
      promptText = `將以下內容解析為精簡的 JSON 格式（例如：{"項目":"值"}）。請使用 ${lang} 回應：${data}`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const result = await response.json();
    
    if (result.error) {
      // 如果連 gemini-pro 都報錯，我們就把錯誤細節傳回網頁，方便診斷
      return res.status(200).json({ 
        error: "Google 伺服器回應錯誤",
        detail: result.error.message 
      });
    }

    const aiResponse = result.candidates[0].content.parts[0].text;
    const jsonMatch = aiResponse.match(/\{.*\}/s);
    const finalData = jsonMatch ? JSON.parse(jsonMatch[0]) : { content: aiResponse };

    return res.status(200).json(finalData);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
