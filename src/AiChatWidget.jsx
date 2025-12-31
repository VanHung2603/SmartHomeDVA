import { useEffect, useRef, useState } from "react";
import "./AiChatWidget.css";

export default function AiChatWidget({ getContext }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Xin chào 👋 Mình là AI trợ lý smarthome. Bạn muốn xem tình trạng hệ thống hay nhờ tư vấn?",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  // Click ngoài để đóng
  useEffect(() => {
    const onDown = (e) => {
      if (!open) return;
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const context = typeof getContext === "function" ? getContext() : {};
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setMessages([...next, { role: "assistant", content: data.reply || "(không có phản hồi)" }]);
    } catch (e) {
      setMessages([
        ...next,
        { role: "assistant", content: `❌ Lỗi: ${e.message || "Không gọi được AI"}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Nút mở chat */}
      <button
        className="ai-fab"
        onClick={() => setOpen(true)}
        aria-label="Open AI chat"
        title="AI Smarthome"
      >
        🤖
      </button>

      {/* Popup */}
      {open && (
        <div className="ai-overlay">
          <div className="ai-box" ref={boxRef}>
            <div className="ai-header">
              <div className="ai-title">AI Smarthome</div>

              {/* ✅ Nút X */}
              <button
                className="ai-close"
                onClick={() => setOpen(false)}
                aria-label="Close"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="ai-body">
              {messages.map((m, i) => (
                <div key={i} className={`ai-msg ${m.role}`}>
                  <b>{m.role === "user" ? "Bạn" : "AI"}:</b> {m.content}
                </div>
              ))}
              {loading && <div className="ai-msg assistant">AI: ...</div>}
            </div>

            <div className="ai-footer">
              <input
                className="ai-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <button className="ai-send" onClick={send} disabled={loading}>
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
