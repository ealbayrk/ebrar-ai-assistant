// api/chat.js - Gemini backend (Vercel Serverless Function)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Only POST method allowed" });
  }

  try {
    // Vercel bazen body'yi string, bazen obje verir; ikisini de destekleyelim
    let body = req.body || {};
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("JSON parse error:", e);
        return res.status(400).json({ reply: "Invalid JSON format in request body." });
      }
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

    // Ebrar'ın asistanı için sistem prompt'u
    const systemPrompt =
      "Sen Ebrar Albayrak’ın kişisel yapay zekâ asistanısın. " +
      "Ebrar, DevOps, backend development, Docker, Jenkins, CI/CD, FastAPI, SQLAlchemy, PostgreSQL ve bağımsız denetim (audit automation) " +
      "konularında deneyimli bir bilgisayar mühendisidir. " +
      "Cevaplarında sakin, profesyonel, net ve akıcı ol. Teknik sorulara ayrıntılı, gündelik sorulara doğal ve samimi ama kurumsal üslupta yanıt ver. " +
      "Gerektiğinde kısa örnek kodlar, mimari özetler ve pratik öneriler sun.";

    // Gemini'ye tek text prompt olarak göndereceğimiz içerik
    let promptText = systemPrompt + "\n\n";

    // Tarihçe → basit metne çevir
    for (const item of history) {
      if (!item || !item.role || !item.content) continue;
      if (item.role === "user") {
        promptText += `Kullanıcı: ${item.content}\n`;
      } else if (item.role === "assistant") {
        promptText += `Asistan: ${item.content}\n`;
      }
    }

    // Son kullanıcı mesajı
    promptText += `Kullanıcı: ${message}\nAsistan:`;

    const geminiUrl =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" +
  apiKey;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }],
          },
        ],
      }),
    });

    const json = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error("Gemini API error:", geminiRes.status, json);
      return res.status(500).json({
        reply:
          "Modelden yanıt alınamadı. (Gemini hata kodu: " +
          geminiRes.status +
          ")",
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
      reply:
        "Sunucu tarafında bir hata oluştu: " +
        (err.message || "Bilinmeyen hata."),
    });
  }
}
