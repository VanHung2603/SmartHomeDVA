import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  const { messages, context } = req.body;

  const system = `
Bạn là AI trợ lý smarthome.
Dựa vào CONTEXT để phân tích hệ thống.
Trả lời ngắn gọn, rõ ràng, tiếng Việt.
Nếu có nguy hiểm (gas cao, alarm), cảnh báo rõ.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: system },
      { role: "system", content: "CONTEXT: " + JSON.stringify(context) },
      ...messages,
    ],
  });

  res.json({ reply: completion.choices[0].message.content });
}
