export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Only POST method allowed" });
  }

  try {
    let body = req.body || {};
    if (typeof body === "string") {
      body = JSON.parse(body);
    }

    const { message, history = [] } = body;

    if (!message) {
      return res.status(400).json({ reply: "Mesaj içeriği bulunamadı." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY eksik");
      return res.status(500).json({
        reply: "Sunucu yapılandırma hatası: GEMINI_API_KEY tanımlı değil.",
      });
    }

    const systemPrompt = 
      "Sen Ebrar Albayrak’ın kişisel yapay zekâ asistanısın. " +
      "Profesyonel, akıcı ve teknik cevaplar ver.";

    let promptText = systemPrompt + "\n\n";

    for (const item of history) {
      if (item.role === "user") {
        promptText += `Kullanıcı: ${item.content}\n`;
      } else if (item.role === "assistant") {
        promptText += `Asistan: ${item.content}\n`;
      }
    }

    promptText += `Kullanıcı: ${message}\nAsistan:`;

    // ⭐ DOĞRU MODEL BURADA
    const modelUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(modelUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
      }),
    });

    const json = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini API error:", geminiRes.status, json);
      return res.status(500).json({
        reply: `Modelden yanıt alınamadı. (Gemini hata kodu: ${geminiRes.status})`,
      });
    }

    const reply =
      json?.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join(" ")
        .trim() || "Model boş yanıt döndürdü.";

    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({
      reply: "Sunucu tarafında bir hata oluştu: " + (err.message || "Bilinmeyen hata."),
    });
  }
}
