import { NextResponse } from "next/server";
import { fetchFeed } from "@/lib/rss";
import db, { initDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  if (secret !== (process.env.SECRET_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await initDb();
  const feedsResult = await db.execute("SELECT url, category, name FROM rss_feeds WHERE active = 1");

  let inserted = 0;
  for (const row of feedsResult.rows) {
    const items = await fetchFeed(row.url as string);
    for (const item of items) {
      if (!item.link || !item.title) continue;
      try {
        const r = await db.execute({
          sql: `INSERT OR IGNORE INTO articles (id, title, description, imageUrl, articleUrl, youtubeId, category, source, publishedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [randomUUID(), item.title, item.description, item.imageUrl || null,
            item.link, item.youtubeId || null, row.category as string,
            row.name as string, new Date(item.pubDate).toISOString()],
        });
        if (r.rowsAffected > 0) inserted++;
      } catch { /* skip duplicates */ }
    }
  }

  return NextResponse.json({ ok: true, inserted });
}
