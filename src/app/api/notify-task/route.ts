import type { NextRequest } from "next/server";

type Payload = {
  title?: string;
  authorName?: string;
  /** display names of the members the task is assigned to */
  assignees?: string[];
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // Notifications are best-effort: if the bot isn't configured, just no-op.
    return Response.json({ ok: false, skipped: "telegram not configured" });
  }

  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title) {
    return Response.json({ ok: false, error: "title required" }, { status: 400 });
  }

  // 🆕 "title" — author  /  👤 assignees (or 🙋 up for grabs)
  const author = body.authorName ? ` — ${escapeHtml(body.authorName)}` : "";
  const names = (body.assignees ?? []).map((n) => escapeHtml(n)).filter(Boolean);
  const assigneeLine = names.length
    ? `\n👤 ${names.join(", ")}`
    : "\n🙋 up for grabs";
  const text = `🆕 <b>${escapeHtml(title)}</b>${author}${assigneeLine}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram error:", data);
      return Response.json({ ok: false, error: data.description }, { status: 502 });
    }
    return Response.json({ ok: true });
  } catch (e) {
    console.error("Telegram request failed:", e);
    return Response.json({ ok: false, error: "request failed" }, { status: 502 });
  }
}
