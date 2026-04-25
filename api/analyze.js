// api/analyze.js - Vercel 多模態 AI 版
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { data, type, mimeType, lang } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).json({ error: 'Missing API Key' });

  try {
    // 💡 關鍵修正：使用 v1beta 路徑，支援音訊與文字
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    let promptParts;
    if (type === 'audio') {
      promptParts = [
        { text: `請聽這段錄音，先完整轉錄成文字放在 "_transcript" 欄位中，然後將內容解析為 JSON 格式。請使用 ${lang} 回應，絕對不要有 Markdown 標籤。` },
        { inline_data: { mime_type: mimeType, data: data } }
      ];
    } else {
      promptParts = [
        { text: `請將以下內容解析為精簡的 JSON 格式，並偵測項目名稱。請使用 ${lang} 回應，絕對不要有 Markdown 標籤：${data}` }
      ];
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: promptParts }] })
    });

    const result = await response.json();
    
    if (result.error) return res.status(500).json({ error: result.error.message });

    const aiText = result.candidates[0].content.parts[0].text;
    const jsonMatch = aiText.match(/\{.*\}/s);
    
    // 如果 AI 沒給 JSON，我們包裝一個回傳
    const finalData = jsonMatch ? JSON.parse(jsonMatch[0]) : { content: aiText };
    return res.status(200).json(finalData);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
