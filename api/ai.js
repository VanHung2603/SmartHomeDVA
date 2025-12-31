export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = process.env.CF_API_TOKEN;
    const account = process.env.CF_ACCOUNT_ID;

    if (!token || !account) {
      return res.status(500).json({ error: "Missing CF_API_TOKEN or CF_ACCOUNT_ID" });
    }

    const { messages = [], context = {} } = req.body || {};

    const system =
      "Bạn là AI trợ lý Smarthome. Trả lời ngắn gọn tiếng Việt. Nếu nguy hiểm (gas cao, alarm ON) phải cảnh báo rõ.";
    const prompt =
      `${system}\nCONTEXT: ${JSON.stringify(context)}\n\n` +
      `${messages.map(m => `${m.role}: ${m.content}`).join("\n")}\nassistant:`;

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
