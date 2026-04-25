// analyze.js - 2026 AI 診斷強化版
export const handler = async (event) => {
  // 1. 只允許 POST 請求
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    const { text } = JSON.parse(event.body);
    const API_KEY = process.env.GEMINI_API_KEY;

    // 💡 診斷：檢查輸入內容
    console.log("收到的語音文字:", text);

    // 2. 呼叫 Google Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ 
          parts: [{ text: "請將以下內容解析為精簡的 JSON 格式（例如：{\"項目\":\"值\"}），絕對不要有任何解釋文字或 Markdown 標籤：" + text }] 
        }]
      })
    });

    const data = await response.json();
    
    // 💡 診斷：檢查 Google 是否有報錯
    if (data.error) {
      console.error("Google API 錯誤:", data.error.message);
      return { statusCode: 500, body: JSON.stringify({ error: data.error.message }) };
    }

    // 3. 提取 AI 回應
    if (!data.candidates || data.candidates.length === 0) {
      console.error("AI 沒有產生任何候選回應");
      return { statusCode: 500, body: JSON.stringify({ error: "AI 無法生成回應" }) };
    }

    const aiResponse = data.candidates[0].content.parts[0].text;
    
    // 💡 診斷：在 Netlify Log 顯示 AI 到底回了什麼
    console.log("AI 原始回應內容:", aiResponse);

    // 4. 清理回應文字（只保留 JSON 部分）
    const jsonMatch = aiResponse.match(/\{.*\}/s);
    const finalResult = jsonMatch ? jsonMatch[0] : aiResponse;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: finalResult
    };

  } catch (error) {
    // 💡 診斷：捕捉系統執行錯誤
    console.error("系統執行異常:", error.message);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: "系統錯誤: " + error.message }) 
    };
  }
};
