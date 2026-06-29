import { NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";

export async function GET(request: Request) {
  await initDb();
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  const pwRow = await db.execute("SELECT value FROM admin_settings WHERE key = 'admin_password'");
  const pw = pwRow.rows[0]?.value as string || "guiman2024";
  if (secret !== pw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const action = searchParams.get("action") || "stats";

  if (action === "stats") {
    const [arts, comms, feeds] = await Promise.all([
      db.execute("SELECT COUNT(*) as total, SUM(clicks) as clicks, SUM(likes) as likes, SUM(shares) as shares FROM articles"),
      db.execute("SELECT COUNT(*) as total FROM comments WHERE approved = 1"),
      db.execute("SELECT COUNT(*) as total FROM rss_feeds WHERE active = 1"),
    ]);
    const topClicked = await db.execute(
      "SELECT id, title, category, clicks, likes, shares FROM articles ORDER BY clicks DESC LIMIT 10"
    );
    const recentComments = await db.execute(
      "SELECT c.*, a.title as articleTitle FROM comments c JOIN articles a ON c.articleId = a.id ORDER BY c.createdAt DESC LIMIT 20"
    );
    return NextResponse.json({
      stats: { ...arts.rows[0], comments: comms.rows[0].total, feeds: feeds.rows[0].total },
      topClicked: topClicked.rows,
      recentComments: recentComments.rows,
    });
  }

  if (action === "articles") {
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 30;
    const offset = (page - 1) * limit;
    const result = await db.execute({
      sql: `SELECT a.*, (SELECT COUNT(*) FROM comments c WHERE c.articleId = a.id) as commentCount
            FROM articles a ORDER BY publishedAt DESC LIMIT ? OFFSET ?`,
      args: [limit, offset],
    });
    const count = await db.execute("SELECT COUNT(*) as total FROM articles");
    return NextResponse.json({ articles: result.rows, total: count.rows[0].total });
  }

  if (action === "comments") {
    const result = await db.execute(
      `SELECT c.*, a.title as articleTitle FROM comments c
       JOIN articles a ON c.articleId = a.id ORDER BY c.createdAt DESC LIMIT 100`
    );
    return NextResponse.json({ comments: result.rows });
  }

  if (action === "feeds") {
    const result = await db.execute("SELECT * FROM rss_feeds ORDER BY category, name");
    return NextResponse.json({ feeds: result.rows });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(request: Request) {
  await initDb();
  const body = await request.json();
  const { secret, action } = body;

  const pwRow = await db.execute("SELECT value FROM admin_settings WHERE key = 'admin_password'");
  const pw = pwRow.rows[0]?.value as string || "guiman2024";
  if (secret !== pw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (action === "delete_comment") {
    await db.execute({ sql: "DELETE FROM comments WHERE id = ?", args: [body.id] });
    return NextResponse.json({ ok: true });
  }
  if (action === "delete_article") {
    await db.execute({ sql: "DELETE FROM comments WHERE articleId = ?", args: [body.id] });
    await db.execute({ sql: "DELETE FROM articles WHERE id = ?", args: [body.id] });
    return NextResponse.json({ ok: true });
  }
  if (action === "toggle_feed") {
    await db.execute({ sql: "UPDATE rss_feeds SET active = ? WHERE id = ?", args: [body.active ? 1 : 0, body.id] });
    return NextResponse.json({ ok: true });
  }
  if (action === "approve_comment") {
    await db.execute({ sql: "UPDATE comments SET approved = ? WHERE id = ?", args: [body.approved ? 1 : 0, body.id] });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
