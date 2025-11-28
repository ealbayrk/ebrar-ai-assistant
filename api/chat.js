// api/chat.js - Vercel Serverless Function (no external deps)

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method allowed" });
  }

  try {
    // Vercel bazen body'yi string, bazen direkt obje verir
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.error("Body parse error:", e);
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const { message, history } = body || {};

    const messages = [
      {
        role: "system",
        content:
          "Sen Ebrar Albayrak’ın kişisel yapay zekâ asistanısın. Ebrar, DevOps, backend development, Docker, Jenkins, CI/CD, audit automation, FastAPI, SQLAlchemy, PostgreSQL konularında deneyimli bir bilgisayar mühendisidir. Sakin, profesyonel ve akıcı bir şekilde cevap ver. Teknik sorulara detaylı, gündelik sorulara doğal cevaplar ver."
      },
      ...(history || []),
      { role: "user", content: message || "" }
    ];

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is missing");
      return res.status(500).json({ error: "Missing API key" });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini", // sorun yaşarsan "gpt-4.1" yapabiliriz
        messages,
        temperature: 0.4,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);
      return res.status(500).json({ error: "AI service error" });
    }

    const reply = data.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Handler error:", error);
    return res.status(500).json({ error: "AI service error" });
  }
}
