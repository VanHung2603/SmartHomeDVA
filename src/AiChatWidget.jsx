import { useEffect, useRef, useState } from "react";

export default function AiChatWidget({ getContext }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Xin chào 👋 Mình là AI trợ lý smarthome. Bạn muốn xem tình trạng hệ thống hay nhờ tư vấn?" }
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const context = getContext();

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMsg], context }),
    });

    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
  }

  return (
    <>
      <button onClick={() => setOpen(!open)} style={btnStyle}>🤖</button>

      {open && (
        <div style={boxStyle}>
          <div style={headerStyle}>AI Smarthome</div>

          <div style={chatStyle}>
            {messages.map((m, i) => (
              <div key={i} style={{ textAlign: m.role === "user" ? "right" : "left", margin: 6 }}>
                <b>{m.role === "user" ? "Bạn" : "AI"}:</b> {m.content}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div style={inputWrap}>
            <input value={input} onChange={(e) => setInput(e.target.value)} style={inputStyle} />
            <button onClick={send}>Gửi</button>
          </div>
        </div>
      )}
    </>
  );
}

const btnStyle = {
  position: "fixed",
  right: 20,
  bottom: 20,
  width: 55,
  height: 55,
  borderRadius: "50%",
  fontSize: 22,
  background: "#5b6cff",
  color: "white",
  border: "none",
  cursor: "pointer",
};

const boxStyle = {
  position: "fixed",
  right: 20,
  bottom: 90,
  width: 340,
  height: 420,
  background: "white",
  borderRadius: 12,
  boxShadow: "0 0 30px rgba(0,0,0,.2)",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = { padding: 10, background: "#5b6cff", color: "white" };
const chatStyle = { flex: 1, padding: 10, overflow: "auto" };
const inputWrap = { display: "flex", gap: 6, padding: 10 };
const inputStyle = { flex: 1, padding: 6 };
