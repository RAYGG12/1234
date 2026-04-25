// analyze.js - 2026 無插件純淨版
exports.handler = async (event) => {
  // 只允許 POST 請求
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { text } = JSON.parse(event.body);
    const API_KEY = process.env.GEMINI_API_KEY;

    // 這裡我們直接呼叫 Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "請將以下內容解析為 JSON 格式，自動偵測項目與數值：" + text }] }]
      })
    });

    const data = await response.json();
    
    // 如果 AI 沒回傳內容
    if (!data.candidates) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "AI 無法回應，請檢查 API Key 是否正確" }) 
      };
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    const jsonMatch = aiResponse.match(/\{.*\}/s); // 抓取 JSON 部分

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: jsonMatch ? jsonMatch[0] : aiResponse
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
