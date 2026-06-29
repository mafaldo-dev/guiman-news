import { NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";

export async function POST(request: Request) {
  await initDb();
  const { articleId, type } = await request.json();
  if (!articleId || !["like", "share", "click"].includes(type)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const col = type === "like" ? "likes" : type === "share" ? "shares" : "clicks";

  await db.execute({
    sql: `UPDATE articles SET ${col} = ${col} + 1 WHERE id = ?`,
    args: [articleId],
  });

  const result = await db.execute({
    sql: `SELECT likes, shares, clicks FROM articles WHERE id = ?`,
    args: [articleId],
  });

  return NextResponse.json({ ok: true, ...result.rows[0] });
}
