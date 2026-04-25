// api/analyze.js - 2026 診斷強化版 v1.1
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { data, type, lang } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  try {
    // 💡 確保使用 v1beta！這是目前 1.5-flash 最穩定的通道
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    console.log("--- 正在使用 v1beta 進行請求 ---");

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: `請將內容解析為 JSON（例如：{"項目":"值"}）。請用 ${lang} 回應，不要 Markdown：${data}` }] 
        }]
      })
    });

    const result = await response.json();
    
    if (result.error) {
      // 這裡會抓到 Google 的真實回應
      return res.status(200).json({ 
        error: "Google API 拒絕請求",
        detail: result.error.message,
        hint: "請確認 Vercel 是否真的更新了程式碼"
      });
    }

    const aiText = result.candidates[0].content.parts[0].text;
    const jsonMatch = aiText.match(/\{.*\}/s);
    return res.status(200).json(jsonMatch ? JSON.parse(jsonMatch[0]) : { content: aiText });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
