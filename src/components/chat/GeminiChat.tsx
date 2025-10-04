import { useEffect, useRef, useState } from "react";
import { getProductsAPI, getCategoryAPI } from "@/services/api";

type Msg = { role: "user" | "model"; text: string; products?: ProductCard[] };
type ProductCard = { id: string; name: string; price: number; thumbnail?: string; url: string };

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const MODEL = "gemini-2.5-flash";   // 👈 lấy từ listModels
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1/models/${MODEL}:generateContent`;


async function gemini(prompt: string) {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [{ text: prompt }],
                },
            ],
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        console.error("Gemini error:", errText);
        throw new Error(errText);
    }
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

function vnd(n: number) {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0,
    }).format(n ?? 0);
}
const strip = (s = "") =>
    s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export default function GeminiChat() {
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [msgs, setMsgs] = useState<Msg[]>([
        {
            role: "model",
            text: "Chào bạn! Mô tả nhu cầu (ngân sách, hãng, kích thước...) để mình gợi ý sản phẩm phù hợp nhé.",
        },
    ]);
    const [loading, setLoading] = useState(false);
    const listRef = useRef<HTMLDivElement>(null);

    // Danh mục
    const [catMap, setCatMap] = useState<Record<string, string>>({});
    const [catNames, setCatNames] = useState<string[]>([]);
    useEffect(() => {
        (async () => {
            try {
                const res = await getCategoryAPI();
                const m: Record<string, string> = {};
                const names: string[] = [];
                res?.data?.result?.forEach((c: any) => {
                    m[strip(c.name)] = c._id;
                    names.push(c.name);
                });
                setCatMap(m);
                setCatNames(names);
            } catch (e) {
                console.warn("Load categories failed", e);
            }
        })();
    }, []);

    useEffect(() => {
        if (open) listRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
    }, [msgs, open]);

    // === Search sản phẩm với fallback ===
    // === TÌM SẢN PHẨM VỚI NHIỀU Fallback ===
    async function searchWithFallback(plan: any) {
        const limit = Math.min(20, Number(plan?.limit) || 10); // tăng limit lên 20

        // 1) query đầy đủ nhất
        let q1 = `current=1&pageSize=${limit}`;
        if (plan?.keywords) q1 += `&mainText=/${encodeURIComponent(plan.keywords)}/i`;

        // map danh mục (fuzzy)
        const askedCats: string[] = Array.isArray(plan?.categories) ? plan.categories : [];
        const catIds = askedCats.map((n) => catMap[strip(n)]).filter(Boolean);
        if (catIds.length) q1 += `&category=${catIds.join(",")}`;
        if (Number(plan?.minPrice) > 0) q1 += `&price>=${Number(plan.minPrice)}`;
        if (Number(plan?.maxPrice) > 0) q1 += `&price<=${Number(plan.maxPrice)}`;
        if (plan?.sort) q1 += `&sort=${plan.sort}`;

        // 2) bỏ price nếu fail
        let q2 = q1.replace(/&price>=[^&]*/g, "").replace(/&price<=[^&]*/g, "");

        // 3) bỏ category nếu fail
        let q3 = q2.replace(/&category=[^&]*/g, "");

        // 4) fallback: bán chạy toàn shop
        const q4 = `current=1&pageSize=${limit}&sort=-sold`;

        const qList = [q1, q2, q3, q4];

        for (const q of qList) {
            try {
                const r = await getProductsAPI(q);
                const items: ProductCard[] =
                    r?.data?.result?.map((p: any) => ({
                        id: p._id,
                        name: p.name || p.mainText,
                        price: p.price,
                        thumbnail: p.thumbnail
                            ? `${import.meta.env.VITE_BACKEND_URL}/images/Product/${p.thumbnail}`
                            : undefined,
                        url: `/Product/${p._id}`,
                    })) || [];

                console.log("Query:", q, "=>", items.length, "sản phẩm"); // debug log

                if (items.length) return items; // nếu có sản phẩm thì trả về luôn
            } catch (e) {
                console.warn("search products failed", q, e);
            }
        }
        return [];
    }


    const send = async () => {
        const text = input.trim();
        if (!text) return;
        setMsgs((m) => [...m, { role: "user", text }]);
        setInput("");
        setLoading(true);

        try {
            // 1) Lấy plan từ Gemini (phân tích câu hỏi)
            const planText = await gemini(
                `Bạn là bộ phân tích truy vấn cho website bán hàng.
Danh mục hiện có của shop: ${catNames.join(", ")}.
Trả về JSON hợp lệ:
{
 "intent": "search" | "qa",
 "keywords": string,
 "categories": string[],
 "minPrice": number | null,
 "maxPrice": number | null,
 "sort": "price" | "-price" | "-sold" | "-updatedAt" | null,
 "limit": number | null
}
Chỉ trả JSON, không thêm chữ.
Người dùng: ${text}`
            );

            let plan: any = {};
            try {
                plan = JSON.parse(planText);
            } catch {
                plan = { intent: "qa", keywords: text };
            }

            // 2) Luôn fetch sản phẩm mới nhất từ API
            const products = await searchWithFallback(plan);

            // 3) Nhờ Gemini tư vấn dựa trên danh sách đã fetch được
            const advisory = await gemini(
                `Bạn là trợ lý bán hàng.
Dựa trên danh sách sản phẩm (JSON) bên dưới và yêu cầu khách, hãy tư vấn ngắn gọn (3–6 câu), so sánh nhanh nếu cần.
Ghi rõ tên và giá (VND). Tránh bịa đặt. Nếu danh sách trống, gợi ý khách cung cấp ngân sách & hãng ưa thích.

Câu hỏi: ${text}
Sản phẩm (JSON): ${JSON.stringify(products)}`
            );

            if (!products.length) {
                setMsgs((m) => [
                    ...m,
                    { role: "model", text: advisory || "Hiện chưa tìm được sản phẩm khớp. Bạn cho mình biết ngân sách và hãng ưa thích nhé?" },
                ]);
            } else {
                setMsgs((m) => [...m, { role: "model", text: advisory, products }]);
            }
        } catch (e: any) {
            setMsgs((m) => [...m, { role: "model", text: `⚠️ Lỗi: ${e.message || e}` }]);
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

    /* --------- UI styles (inline) ---------- */
    const wrap: React.CSSProperties = {
        position: "fixed",
        right: 20,
        bottom: 20,
        zIndex: 9999,
        fontFamily: "Inter,system-ui,Segoe UI,Roboto,Helvetica,Arial",
    };
    const button: React.CSSProperties = {
        width: 56,
        height: 56,
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: "linear-gradient(135deg,#105aa2,#1677ff)",
        color: "#fff",
        boxShadow: "0 10px 24px rgba(0,0,0,.15)",
        fontWeight: 800,
        fontSize: 22,
    };
    const panel: React.CSSProperties = {
        width: 360,
        height: 560,
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
        height: 560 - 52 - 92,
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
    const grid: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: 8,
        marginTop: 6,
    };
    const card: React.CSSProperties = {
        display: "grid",
        gridTemplateColumns: "64px 1fr",
        gap: 10,
        alignItems: "center",
        padding: 8,
        border: "1px solid #eef0f2",
        borderRadius: 10,
        background: "#fff",
    };
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
                        <span>Hỗ trợ khách hàng tự động</span>
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
                                <div>{m.text}</div>
                                {!!m.products?.length && (
                                    <div style={grid}>
                                        {m.products.map((p) => (
                                            <a
                                                key={p.id}
                                                href={p.url}
                                                style={{ textDecoration: "none", color: "inherit" }}
                                            >
                                                <div style={card}>
                                                    <div
                                                        style={{
                                                            width: 64,
                                                            height: 64,
                                                            borderRadius: 8,
                                                            background: "#f6f8fa",
                                                            display: "grid",
                                                            placeItems: "center",
                                                            overflow: "hidden",
                                                        }}
                                                    >
                                                        {p.thumbnail ? (
                                                            <img
                                                                src={p.thumbnail}
                                                                alt={p.name}
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    objectFit: "cover",
                                                                }}
                                                            />
                                                        ) : (
                                                            <span
                                                                style={{ fontSize: 12, color: "#98a2b3" }}
                                                            >
                                                                No image
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div
                                                            style={{
                                                                fontWeight: 600,
                                                                fontSize: 14,
                                                                lineHeight: "18px",
                                                                display: "-webkit-box",
                                                                WebkitBoxOrient: "vertical" as any,
                                                                WebkitLineClamp: 2,
                                                                overflow: "hidden",
                                                            }}
                                                        >
                                                            {p.name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                color: "#105aa2",
                                                                fontWeight: 700,
                                                                marginTop: 2,
                                                            }}
                                                        >
                                                            {vnd(p.price)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {loading && <div style={bubble("model")}>Đang soạn…</div>}
                    </div>

                    <div style={inputWrap}>
                        <textarea
                            style={textarea}
                            placeholder="Hỏi: laptop tầm 15tr, 15.6”, thích Asus… (Enter để gửi)"
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
