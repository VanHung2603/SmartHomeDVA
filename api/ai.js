export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = process.env.HF_API_TOKEN;
    if (!token) return res.status(500).json({ error: "Missing HF_API_TOKEN on Vercel" });

    const { messages = [], context = null } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages must be an array" });

    const model = "google/flan-t5-base";

    const system =
      "Bạn là AI trợ lý Smarthome. Trả lời ngắn gọn, rõ ràng, tiếng Việt. Nếu nguy hiểm (gas cao, alarm ON) phải cảnh báo.";
    const convo = messages.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n");

    const prompt =
      `${system}\n` +
      `CONTEXT: ${JSON.stringify(context)}\n\n` +
      `${convo}\nAssistant:`;

    const hfRes = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
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
      }),
    });

    const raw = await hfRes.text();
    let data;
    try { data = JSON.parse(raw); } catch { return res.status(500).json({ error: raw }); }

    if (!hfRes.ok) {
      return res.status(hfRes.status).json({ error: data?.error || raw });
    }

    let reply = "";
    if (Array.isArray(data) && data[0]?.generated_text) reply = data[0].generated_text;
    else if (typeof data?.generated_text === "string") reply = data.generated_text;
    else reply = JSON.stringify(data);

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
