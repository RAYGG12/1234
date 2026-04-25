const fetch = require('node-fetch');
export const handler = async (event) => {
  // 只允許 POST 請求
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { text } = JSON.parse(event.body);
  const API_KEY = process.env.GEMINI_API_KEY; // 這是我們在 Netlify 後台設定的金鑰

  // 餵給 AI 的指令（Prompt）
  const prompt = `請將以下語音轉錄內容解析為 JSON 格式。
  自動偵測所有提到的項目（例如日期、金額、公司、品項、備註等）。
  內容：${text}
  請只回傳 JSON 格式，不要有其他文字。`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    // 檢查 AI 是否有正確回傳
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("AI 無法解析內容");
    }

    let aiText = data.candidates[0].content.parts[0].text;
    
    // 處理 AI 有時會多給的 Markdown 符號 (```json ... ```)
    const jsonMatch = aiText.match(/\{.*\}/s);
    const cleanedJson = jsonMatch ? jsonMatch[0] : aiText;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: cleanedJson
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI 服務暫時不可用", details: error.message })
    };
  }
};
