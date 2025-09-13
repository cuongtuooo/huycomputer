import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "model"; text: string };

const GEMINI_API_KEY =
    import.meta.env.VITE_GEMINI_API_KEY || "<PASTE_KEY_HERE>"; // fallback nếu chưa set env
const GEMINI_ENDPOINT =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";

async function callGemini(messages: Msg[]): Promise<string> {
    const contents = messages.map((m) => ({
        role: m.role === "model" ? "model" : "user",
        parts: [{ text: m.text }],
    }));

    const res = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents }),
    });

    if (!res.ok) {
        const t = await res.text();
        throw new Error(`HTTP ${res.status} - ${t}`);
    }

    const data = await res.json();
    return (
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Mình chưa nhận được nội dung phản hồi."
    );
}

export default function GeminiChat() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [msgs, setMsgs] = useState<Msg[]>([
        { role: "model", text: "Xin chào! Mình là Gemini. Bạn cần gì nè? 😊" },
    ]);
    const [loading, setLoading] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) listRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
    }, [msgs, open]);

    const send = async () => {
        const text = input.trim();
        if (!text) return;
        const userMsg: Msg = { role: "user", text };
        setMsgs((m) => [...m, userMsg]);
        setInput("");
        setLoading(true);
        try {
            const reply = await callGemini([...msgs, userMsg]);
            setMsgs((m) => [...m, { role: "model", text: reply }]);
        } catch (e: any) {
            setMsgs((m) => [
                ...m,
                { role: "model", text: `⚠️ Lỗi gọi Gemini: ${e.message}` },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    // === UI (inline style gọn đẹp) ===
    const wrap: React.CSSProperties = {
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 9999,
        fontFamily:
            '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Inter,"Helvetica Neue",Arial',
    };
    const button: React.CSSProperties = {
        width: 56,
        height: 56,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background:
            "linear-gradient(135deg, rgba(16,90,162,1) 0%, rgba(22,119,255,1) 100%)",
        color: "#fff",
        boxShadow: "0 10px 24px rgba(0,0,0,.15)",
        fontWeight: 800,
        fontSize: 22,
    };
    const panel: React.CSSProperties = {
        width: 360,
        height: 520,
        background: "#fff",
        border: "1px solid #eef0f2",
        boxShadow: "0 1px 2px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06)",
        borderRadius: 16,
        overflow: "hidden",
    };
    const header: React.CSSProperties = {
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
        background: "#105aa2",
        color: "#fff",
        fontWeight: 700,
    };
    const list: React.CSSProperties = {
        height: 520 - 52 - 72,
        overflowY: "auto",
        padding: 12,
        background: "#f6f8fa",
    };
    const bubble = (role: Msg["role"]): React.CSSProperties => ({
        maxWidth: "84%",
        padding: "10px 12px",
        borderRadius: 12,
        margin: "6px 0",
        whiteSpace: "pre-wrap",
        lineHeight: "20px",
        ...(role === "user"
            ? {
                marginLeft: "auto",
                background: "rgba(22,119,255,.12)",
                color: "#105aa2",
                border: "1px solid rgba(22,119,255,.24)",
            }
            : {
                background: "#fff",
                color: "#2f3640",
                border: "1px solid #eef0f2",
            }),
    });
    const inputWrap: React.CSSProperties = {
        padding: 12,
        borderTop: "1px solid #eef0f2",
        background: "#fff",
    };
    const textarea: React.CSSProperties = {
        width: "100%",
        minHeight: 44,
        maxHeight: 90,
        padding: "10px 12px",
        borderRadius: 10,
        border: "1px solid #e6eaf0",
        outline: "none",
        resize: "vertical",
        fontSize: 14,
    };
    const sendBtn: React.CSSProperties = {
        marginTop: 8,
        width: "100%",
        height: 36,
        borderRadius: 10,
        border: "none",
        background: "#105aa2",
        color: "#fff",
        fontWeight: 700,
        cursor: "pointer",
        opacity: loading ? 0.7 : 1,
    };

    return (
        <div style={wrap}>
            {!open ? (
                <button
                    style={button}
                    title="Chat với Gemini"
                    onClick={() => setOpen(true)}
                >
                    ⟮💬⟯
                </button>
            ) : (
                <div style={panel}>
                    <div style={header}>
                        <span>Gemini Chat</span>
                        <button
                            onClick={() => setOpen(false)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "#fff",
                                fontSize: 20,
                                cursor: "pointer",
                            }}
                            title="Thu gọn"
                        >
                            ✕
                        </button>
                    </div>

                    <div ref={listRef} style={list}>
                        {msgs.map((m, i) => (
                            <div key={i} style={bubble(m.role)}>
                                {m.text}
                            </div>
                        ))}
                        {loading && <div style={bubble("model")}>Đang soạn…</div>}
                    </div>

                    <div style={inputWrap}>
                        <textarea
                            style={textarea}
                            placeholder="Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKey}
                        />
                        <button onClick={send} style={sendBtn} disabled={loading}>
                            Gửi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
