// api/analyze.js - 2026 最穩定版 (使用 gemini-pro)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { data, type, lang } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) return res.status(500).json({ error: '找不到金鑰，請檢查 Vercel 設定' });

  try {
    // 💡 關鍵：切換到最穩定的 v1 路徑與 gemini-pro 模型
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    // 整理發送給 AI 的文字指令
    const prompt = `你是一個數據整理助理。請將以下內容解析為精簡的 JSON 格式（例如：{"項目":"值", "金額":"值"}）。請使用 ${lang} 回應，不要有 Markdown 標籤。內容是：${data}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await response.json();
    
    if (result.error) {
      console.error("Google 報錯:", result.error.message);
      return res.status(200).json({ 
        error: "AI 暫時迷路",
        detail: result.error.message 
      });
    }

    // 抓取 AI 回傳的純文字
    const aiText = result.candidates[0].content.parts[0].text;
    
    // 試著從 AI 的回話中把 JSON 挖出來
    const jsonMatch = aiText.match(/\{.*\}/s);
    const finalData = jsonMatch ? JSON.parse(jsonMatch[0]) : { content: aiText };

    return res.status(200).json(finalData);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
