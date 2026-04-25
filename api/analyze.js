// analyze.js - 正式版穩定連線碼
export const handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { text } = JSON.parse(event.body);
    const API_KEY = process.env.GEMINI_API_KEY;

    // 💡 修正點：將 v1beta 改為 v1，這是目前最穩定的正式路徑
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: "請將以下內容解析為精簡的 JSON 格式（例如：{\"項目\":\"值\"}），絕對不要有任何解釋文字或 Markdown 標籤：" + text }] 
        }]
      })
    });

    const data = await response.json();
    
    if (data.error) {
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    const jsonMatch = aiResponse.match(/\{.*\}/s);
    const finalResult = jsonMatch ? jsonMatch[0] : aiResponse;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: finalResult
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
