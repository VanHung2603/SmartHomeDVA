export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = process.env.HF_API_TOKEN; // token HF của bạn
    if (!token) return res.status(500).json({ error: "Missing HF_API_TOKEN on Vercel" });

    const { messages = [], context = null } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages must be an array" });

    // Bạn có thể đổi model. Nên chọn model chat/instruct nhỏ.
    // Lưu ý: model phải “available” trên Inference Providers/Router của HF.
    const model = "HuggingFaceH4/zephyr-7b-beta";

    // Nhét context realtime vào system message
    const sys = [
      {
        role: "system",
        content:
          "Bạn là AI trợ lý Smarthome. Trả lời ngắn gọn tiếng Việt. Nếu nguy hiểm (gas cao, alarm ON) phải cảnh báo rõ.",
      },
      { role: "system", content: "CONTEXT: " + JSON.stringify(context) },
    ];

    const hfRes = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [...sys, ...messages],
        temperature: 0.3,
        max_tokens: 220,
        stream: false,
      }),
    });

    const raw = await hfRes.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}

    if (!hfRes.ok) {
      // Router sẽ trả error rõ (401/402/429/...)
      return res.status(hfRes.status).json({ error: data?.error?.message || data?.error || raw });
    }

    const reply = data?.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
