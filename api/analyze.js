// api/analyze.js - 2026 穩定通訊版
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { data, type, mimeType, lang } = req.body;
  const API_KEY = process.env.GEMINI_API_KEY;

  try {
    // 💡 嘗試使用最標準的 v1 正式版路徑
    const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    let promptContent;
    if (type === 'audio') {
      promptContent = [
        { text: `請聽這段錄音，先完整轉錄成文字放在 "_transcript" 欄位中，然後將內容解析為 JSON 格式（例如：{"日期":"xxx", "品項":"xxx"}）。請使用 ${lang} 進行回應，不要有 Markdown 標籤。` },
        { inline_data: { mime_type: mimeType, data: data } }
      ];
    } else {
      promptContent = [
        { text: `將以下內容解析為精簡的 JSON 格式（例如：{"項目":"值"}）。請使用 ${lang} 回應：${data}` }
      ];
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: promptContent }] })
    });

    const result = await response.json();
    
    // 💡 如果 Google 說找不到模型，這裡會抓到具體原因
    if (result.error) {
      console.error("Google 回傳錯誤:", result.error);
      return res.status(200).json({ 
        error: "Google 暫時無法辨識此模型",
        detail: result.error.message 
      });
    }

    const aiResponse = result.candidates[0].content.parts[0].text;
    const jsonMatch = aiResponse.match(/\{.*\}/s);
    const finalData = jsonMatch ? JSON.parse(jsonMatch[0]) : { content: aiResponse };

    return res.status(200).json(finalData);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
