// api/chat.js - Vercel Serverless Function

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST method allowed" });
  }

  try {
    const { message, history } = req.body;

    const messages = [
      {
        role: "system",
        content:
          "Sen Ebrar Albayrak’ın kişisel yapay zekâ asistanısın. Ebrar, DevOps, backend development, Docker, Jenkins, CI/CD, audit automation, FastAPI, SQLAlchemy, PostgreSQL konularında deneyimli bir bilgisayar mühendisidir. Sakin, profesyonel ve akıcı bir şekilde cevap ver. Teknik sorulara detaylı, gündelik sorulara doğal cevaplar ver."
      },
      ...(history || []),
      { role: "user", content: message }
    ];

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages,
      temperature: 0.4,
    });

    const reply = completion.choices[0]?.message?.content || "";
    res.status(200).json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI service error" });
  }
}
