"use client";
import { Article, CATEGORY_COLORS } from "@/lib/types";
import { EngagementBar } from "./EngagementBar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

function timeAgo(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR }); }
  catch { return ""; }
}

function CategoryBadge({ category }: { category: string }) {
  const c = CATEGORY_COLORS[category] || { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" };
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {category}
    </span>
  );
}

async function trackClick(articleId: string) {
  await fetch("/api/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleId, type: "click" }),
  });
}

export function FeaturedCard({ article }: { article: Article }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm">
      <a
        href={article.articleUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick(article.id)}
        className="block"
      >
        <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-zinc-800 to-zinc-950 overflow-hidden">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-20">
              <span className="text-6xl">📰</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full tracking-wider uppercase">
              🔥 Destaque
            </span>
            {article.youtubeId && (
              <span className="bg-black/70 text-white text-[10px] font-medium px-2 py-1 rounded-full flex items-center gap-1">
                ▶ Vídeo
              </span>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CategoryBadge category={article.category} />
            </div>
            <h2 className="text-white text-[16px] font-bold leading-tight line-clamp-2 drop-shadow-sm">
              {article.title}
            </h2>
          </div>
        </div>
        <div className="p-4 pb-0">
          <p className="text-zinc-500 dark:text-zinc-400 text-[13px] leading-relaxed line-clamp-3 mb-3">
            {article.description}
          </p>
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-2">
              <span className="font-medium text-zinc-600 dark:text-zinc-300">{article.source}</span>
              <span>·</span>
              <span>{timeAgo(article.publishedAt)}</span>
            </div>
            <span className="text-blue-500 font-medium">ler mais →</span>
          </div>
        </div>
      </a>
      <div className="px-4">
        <EngagementBar
          articleId={article.id}
          initialLikes={Number(article.likes)}
          initialShares={Number(article.shares)}
          initialComments={Number(article.commentCount || 0)}
        />
      </div>
    </div>
  );
}

export function ArticleCard({ article }: { article: Article }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <a
        href={article.articleUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackClick(article.id)}
        className="flex gap-3 p-3"
      >
        <div className="w-[88px] h-[72px] flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          {article.imageUrl ? (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <span className="text-3xl opacity-20">📰</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <CategoryBadge category={article.category} />
            {article.youtubeId && (
              <span className="text-[9px] text-red-500 font-bold uppercase tracking-wide">▶ Vídeo</span>
            )}
          </div>
          <h3 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 mb-1">
            {article.title}
          </h3>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="font-medium text-zinc-500 dark:text-zinc-400">{article.source}</span>
            <span>·</span>
            <span>{timeAgo(article.publishedAt)}</span>
          </div>
        </div>
      </a>
      <div className="px-3 border-t border-zinc-100 dark:border-zinc-800">
        <EngagementBar
          articleId={article.id}
          initialLikes={Number(article.likes)}
          initialShares={Number(article.shares)}
          initialComments={Number(article.commentCount || 0)}
        />
      </div>
    </div>
  );
}
