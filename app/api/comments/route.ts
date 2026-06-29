import { NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  await initDb();
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");
  if (!articleId) return NextResponse.json({ error: "Missing articleId" }, { status: 400 });

  const result = await db.execute({
    sql: `SELECT * FROM comments WHERE articleId = ? AND approved = 1 ORDER BY createdAt DESC`,
    args: [articleId],
  });

  return NextResponse.json({ comments: result.rows });
}

export async function POST(request: Request) {
  await initDb();
  const { articleId, author, content } = await request.json();
  if (!articleId || !content?.trim()) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const id = randomUUID();
  const authorName = author?.trim() || "Anônimo";

  await db.execute({
    sql: `INSERT INTO comments (id, articleId, author, content, approved) VALUES (?, ?, ?, ?, 1)`,
    args: [id, articleId, authorName, content.trim()],
  });

  const comment = await db.execute({
    sql: `SELECT * FROM comments WHERE id = ?`,
    args: [id],
  });

  return NextResponse.json({ ok: true, comment: comment.rows[0] });
}
