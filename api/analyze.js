export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { data, type, lang } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  // 💡 嘗試這兩個最可能的路徑
  const urls = [
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`
  ];

  let lastError = "";

  for (let url of urls) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `將內容解析為 JSON（例如：{"項目":"值"}）。請用 ${lang} 回應，不要 Markdown：${data}` }] }]
        })
      });

      const result = await response.json();
      
      // 如果這組 URL 成功了，直接回傳
      if (!result.error && result.candidates) {
        const aiText = result.candidates[0].content.parts[0].text;
        const jsonMatch = aiText.match(/\{.*\}/s);
        return res.status(200).json(jsonMatch ? JSON.parse(jsonMatch[0]) : { content: aiText });
      }
      
      lastError = result.error ? result.error.message : "未知錯誤";
      console.log(`嘗試路徑失敗: ${url}，錯誤: ${lastError}`);
    } catch (err) {
      lastError = err.message;
    }
  }

  // 如果全部都失敗，回傳最終錯誤
  return res.status(200).json({ 
    error: "AI 暫時無法連線", 
    detail: lastError,
    hint: "請檢查 Vercel 裡的 API Key 前後是否有空格" 
  });
}
