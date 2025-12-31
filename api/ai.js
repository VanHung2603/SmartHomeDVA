/* eslint-env node */
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages = [], context = null } = req.body || {};

    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "Bạn là AI trợ lý Smarthome. Trả lời ngắn gọn, tiếng Việt, dựa trên CONTEXT. Nếu nguy hiểm (gas cao, alarm) phải cảnh báo rõ.",
        },
        { role: "system", content: "CONTEXT: " + JSON.stringify(context) },
        ...messages,
      ],
      temperature: 0.4,
    });

    const reply = completion.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Server error" });
  }
}
