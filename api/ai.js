export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = process.env.HF_API_TOKEN;
    if (!token) {
      return res.status(500).json({ error: "Missing HF_API_TOKEN" });
    }

    const { messages = [], context = {} } = req.body;

    const system =
      "Bạn là AI trợ lý Smarthome. Trả lời ngắn gọn, rõ ràng, tiếng Việt. Nếu nguy hiểm (gas cao, alarm ON) phải cảnh báo rõ.";

    const chat = messages.map(m => `${m.role}: ${m.content}`).join("\n");

    const prompt =
`${system}
CONTEXT: ${JSON.stringify(context)}

${chat}
assistant:`;    

    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/google/flan-t5-base",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_new_tokens: 200,
            temperature: 0.3
          }
        }),
      }
    );

    const data = await hfRes.json();

    if (!hfRes.ok) {
      return res.status(500).json({ error: data.error || "HF error" });
    }

    const reply = Array.isArray(data) ? data[0].generated_text : data.generated_text;
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
