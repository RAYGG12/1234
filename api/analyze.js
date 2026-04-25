// api/analyze.js - Vercel 穩定相容版
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { data, type, mimeType, lang } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  try {
    // 💡 關鍵修正：換回 v1beta，這是目前 Gemini 1.5 Flash 最穩定的路徑
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    let promptContent;
    if (type === 'audio') {
      promptContent = [
        { text: `請聽錄音，先完整轉錄成文字放在 "_transcript" 欄位，然後解析為 JSON 格式（例如：{"日期":"xxx", "品項":"xxx"}）。請用 ${lang} 回應，不要有 Markdown 標籤。` },
        { inline_data: { mime_type: mimeType, data: data } }
      ];
    } else {
      promptContent = [
        { text: `將以下文字解析為精簡 JSON，偵測項目。請用 ${lang} 回應：${data}` }
      ];
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: promptContent }] })
    });

    const result = await response.json();
    
    if (result.error) return res.status(500).json({ error: result.error.message });

    const aiResponse = result.candidates[0].content.parts[0].text;
    const jsonMatch = aiResponse.match(/\{.*\}/s);
    
    // 如果 AI 回傳的是 JSON，就解析它；否則回傳原始文字
    const finalData = jsonMatch ? JSON.parse(jsonMatch[0]) : { content: aiResponse };

    return res.status(200).json(finalData);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
