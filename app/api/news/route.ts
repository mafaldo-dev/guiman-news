import { NextResponse } from "next/server";
import db, { initDb } from "@/lib/db";

export async function GET(request: Request) {
  await initDb();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "";
  const date = searchParams.get("date") || "";
  const sort = searchParams.get("sort") || "recent";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const conditions: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const args: any[] = [];

  if (category && category !== "Todos") {
    conditions.push("a.category = ?");
    args.push(category);
  }
  if (date) {
    conditions.push("DATE(a.publishedAt) = ?");
    args.push(date);
  }
  if (search) {
    conditions.push("(a.title LIKE ? OR a.description LIKE ?)");
    args.push(`%${search}%`, `%${search}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderBy = sort === "oldest" ? "a.publishedAt ASC"
    : sort === "popular" ? "a.likes DESC"
    : "a.publishedAt DESC";

  const countResult = await db.execute({ sql: `SELECT COUNT(*) as total FROM articles a ${where}`, args });
  const total = Number(countResult.rows[0].total);

  const result = await db.execute({
    sql: `SELECT a.*, (SELECT COUNT(*) FROM comments c WHERE c.articleId = a.id AND c.approved = 1) as commentCount
          FROM articles a ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    args: [...args, limit, offset],
  });

  const categories = await db.execute("SELECT DISTINCT category FROM articles ORDER BY category");

  return NextResponse.json({
    articles: result.rows,
    total,
    page,
    pages: Math.ceil(total / limit),
    categories: categories.rows.map((r) => r.category),
  });
}
