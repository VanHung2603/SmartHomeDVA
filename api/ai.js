export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = process.env.HF_API_TOKEN;
    if (!token) return res.status(500).json({ error: "Missing HF_API_TOKEN on Vercel" });

    const { messages = [], context = null } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages must be an array" });

    // Model nhỏ, chạy được trên HF Inference API free tier
    // Bạn có thể đổi model nếu muốn
    const model = "google/flan-t5-base"; // nhẹ, rẻ, ổn cho QA/tóm tắt

    // Ghép prompt: system + context + hội thoại
    const system =
      "Bạn là AI trợ lý Smarthome. Trả lời ngắn gọn, rõ ràng, tiếng Việt. Nếu phát hiện nguy hiểm (gas cao, alarm ON) phải cảnh báo.";
    const convo = messages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const prompt =
      `${system}\n` +
      `CONTEXT (realtime snapshot): ${JSON.stringify(context)}\n\n` +
      `${convo}\nAssistant:`;

    const hfRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 180,
          temperature: 0.3,
          return_full_text: false,
        },
        options: {
          wait_for_model: true, // model cold-start thì đợi
        },
      }),
    });

    const text = await hfRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: `HF invalid JSON: ${text}` });
    }

    if (!hfRes.ok) {
      // HF thường trả {error: "..."} hoặc {estimated_time: ...}
      return res.status(hfRes.status).json({ error: data?.error || text });
    }

    // HF trả về nhiều format tùy model
    // flan-t5 thường trả: [{ generated_text: "..." }]
    let reply = "";
    if (Array.isArray(data) && data[0]?.generated_text) reply = data[0].generated_text;
    else if (typeof data?.generated_text === "string") reply = data.generated_text;
    else reply = JSON.stringify(data);

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
