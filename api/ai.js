export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = process.env.CF_API_TOKEN;
    const account = process.env.CF_ACCOUNT_ID;

    if (!token || !account) {
      return res.status(500).json({ error: "Missing CF_API_TOKEN or CF_ACCOUNT_ID" });
    }

    const { messages = [], context = {} } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages must be an array" });
    }

    const prompt = `
### SYSTEM (BẮT BUỘC TUÂN THỦ)
Bạn là AI trợ lý Smarthome của trường Dương Văn An.
CHỈ được trả lời bằng TIẾNG VIỆT. Tuyệt đối không dùng tiếng Anh.
Trả lời ngắn gọn, kỹ thuật, rõ ràng.
Nếu phát hiện nguy hiểm (gas cao, alarm ON) thì phải CẢNH BÁO NGAY.

### TRẠNG THÁI HỆ THỐNG (JSON)
${JSON.stringify(context, null, 2)}

### HỘI THOẠI
${messages.map(m => `${String(m.role || "user").toUpperCase()}: ${String(m.content || "")}`).join("\n")}

### AI (trả lời bằng tiếng Việt):
`.trim();

    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${account}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      }
    );

    const data = await r.json();

    if (!r.ok) {
      return res.status(500).json({ error: data?.errors || data });
    }

    return res.status(200).json({ reply: data?.result?.response || "" });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
}
