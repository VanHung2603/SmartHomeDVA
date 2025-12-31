import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY on Vercel" });
    }

    const client = new OpenAI({ apiKey });

    const { messages = [], context = null } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Bạn là AI trợ lý Smarthome. Trả lời ngắn gọn tiếng Việt, dựa trên CONTEXT. Nếu nguy hiểm (gas cao, alarm) cảnh báo rõ.",
        },
        { role: "system", content: "CONTEXT: " + JSON.stringify(context) },
        ...messages,
      ],
    });

    return res.status(200).json({
      reply: completion.choices?.[0]?.message?.content ?? "",
    });
  } catch (e) {
    return res.status(500).json({
      error: e?.message || String(e),
      name: e?.name,
      status: e?.status,
    });
  }
}
