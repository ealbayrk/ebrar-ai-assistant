// api/chat.js — Gemini API Backend

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method allowed" });
  }

  try {
    let body = req.body;

    // Bazı durumlarda Vercel body'yi string verir, parse edelim:
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON format" });
      }
    }

    const { message, history } = body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    // Gemini formatına uygun içerik
    const contents = [];

    // Sistem prompt → Asistanın karakteri
    contents.push({
      role: "user",
      parts: [
        { text: `
Sen Ebrar Albayrak’ın kişisel yapay zekâ asistanısın.
Ebrar; DevOps, backend development, Docker, Jenkins, CI/CD, audit automation,
FastAPI, SQLAlchemy ve PostgreSQL konularında deneyimli bir mühendistir.

Sen sakin, profesyonel ve doğal bir tonla konuşursun.
Teknik sorulara detaylı ve doğru yanıt verirsin.
Gündelik sorulara ise insan gibi doğal cevaplar verirsin.
` }
      ]
    });

    // Kullanıcı mesajı
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    // API İsteği
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    );

    const data = await response.json();

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Cevap alınamadı.";

    res.status(200).json({ reply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gemini API error" });
  }
}
