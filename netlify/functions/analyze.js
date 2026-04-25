// analyze.js - 2026 無插件純淨版
export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { text } = JSON.parse(event.body);
    const API_KEY = process.env.GEMINI_API_KEY;

    const prompt = `請將以下語音內容解析為 JSON 格式，自動偵測項目與數值。內容：${text}`;

    // 直接使用內建 fetch，不需要 require
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (!data.candidates) {
      return { statusCode: 500, body: JSON.stringify({ error: "API Key 格式或權限可能有誤" }) };
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    const jsonMatch = aiResponse.match(/\{.*\}/s);

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
