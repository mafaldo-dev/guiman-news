"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Article, CATEGORIES, CATEGORY_EMOJI } from "@/lib/types";
import { FeaturedCard, ArticleCard } from "./ArticleCard";

const SORTS = [
  { value: "recent", label: "Recentes" },
  { value: "popular", label: "Populares" },
  { value: "oldest", label: "Antigos" },
];

export function NewsFeed() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);

  const [category, setCategory] = useState("Todos");
  const [date, setDate] = useState("");
  const [sort, setSort] = useState("recent");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchNews = useCallback(async (pg = 1, reset = false) => {
    if (pg === 1) setLoading(true);
    const params = new URLSearchParams({ category, date, sort, search, page: String(pg) });
    const res = await fetch(`/api/news?${params}`);
    const data = await res.json();
    if (reset || pg === 1) setArticles(data.articles || []);
    else setArticles(prev => [...prev, ...(data.articles || [])]);
    setPage(pg);
    setPages(data.pages);
    setTotal(data.total);
    setLoading(false);
  }, [category, date, sort, search]);

  useEffect(() => { fetchNews(1, true); }, [fetchNews]);

  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && page < pages && !loading) fetchNews(page + 1);
    }, { threshold: 0.1 });
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [page, pages, loading, fetchNews]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  async function handleFetchRSS() {
    setFetching(true);
    await fetch("/api/fetch-news?secret=guiman2024");
    await fetchNews(1, true);
    setFetching(false);
  }

  const featured = articles[0];
  const rest = articles.slice(1);
  const hasFilters = category !== "Todos" || date || sort !== "recent" || search;

  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-zinc-950">
      {/* ── HEADER ────────────────────────── */}
      <header className="bg-white dark:bg-zinc-900 border-b-2 border-red-600 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-lg font-black tracking-tighter">PORTAL</span>
                <span className="text-zinc-900 dark:text-white text-lg font-black tracking-tighter">GUIMAN</span>
                <span className="bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded tracking-wide">NEWS</span>
              </div>
              <p className="text-[10px] text-zinc-400 tracking-widest uppercase mt-0.5">
                notícias que importam
              </p>
            </div>
            <button
              onClick={handleFetchRSS}
              disabled={fetching}
              className="flex items-center gap-1.5 bg-zinc-900 dark:bg-zinc-700 text-white text-xs font-semibold px-3 py-2 rounded-lg active:scale-95 transition-all disabled:opacity-60"
            >
              <span className={fetching ? "animate-spin inline-block" : ""}>
                {fetching ? "⟳" : "↻"}
              </span>
              <span className="hidden sm:inline">{fetching ? "Atualizando..." : "Atualizar"}</span>
            </button>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl px-3 py-2.5">
              <span className="text-zinc-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Buscar notícias..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }} className="text-zinc-400 text-xs">✕</button>
              )}
            </div>
            <button
              type="submit"
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold"
            >
              Buscar
            </button>
          </form>
        </div>

        {/* Category tabs */}
        <div className="flex gap-0 overflow-x-auto scrollbar-hide border-t border-zinc-100 dark:border-zinc-800">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setPage(1); }}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${category === cat
                ? "border-red-600 text-red-600 bg-red-50 dark:bg-red-950/20"
                : "border-transparent text-zinc-500 dark:text-zinc-400"
                }`}
            >
              <span>{CATEGORY_EMOJI[cat]}</span>
              <span className="whitespace-nowrap">{cat}</span>
            </button>
          ))}
        </div>
      </header>

      {/* ── FILTER BAR ────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-2 flex items-center gap-3">
        <button
          onClick={() => setShowFilters(v => !v)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${showFilters || hasFilters
            ? "bg-red-50 text-red-600 dark:bg-red-950/30"
            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
        >
          <span>⚙</span> Filtros
          {hasFilters && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
        </button>

        {SORTS.map(s => (
          <button
            key={s.value}
            onClick={() => { setSort(s.value); setPage(1); }}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${sort === s.value
              ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
          >
            {s.label}
          </button>
        ))}

        {total > 0 && (
          <span className="ml-auto text-[11px] text-zinc-400">{total} artigos</span>
        )}
      </div>

      {/* ── DATE FILTER ───────────────────── */}
      {showFilters && (
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Data</label>
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setPage(1); }}
              className="text-sm bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-900 dark:text-zinc-100 outline-none"
            />
            {date && (
              <button onClick={() => setDate("")} className="text-xs text-red-500 font-medium">Limpar</button>
            )}
          </div>
        </div>
      )}

      {/* ── BREAKING NEWS TICKER ──────────── */}
      {!loading && articles.length > 0 && (
        <div className="bg-red-600 text-white flex items-center overflow-hidden h-8">
          <span className="flex-shrink-0 bg-red-800 text-white text-[10px] font-black px-3 h-full flex items-center tracking-widest uppercase">
            AO VIVO
          </span>
          <div className="overflow-hidden flex-1 relative h-full">
            <div className="flex items-center h-full animate-marquee whitespace-nowrap gap-8 px-4 text-xs font-medium">
              {articles.slice(0, 5).map(a => (
                <span key={a.id}>● {a.title}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ───────────────────────── */}
      <main className="px-4 py-4 space-y-3 max-w-lg mx-auto">
        {loading && (
          <div className="space-y-3">
            <div className="aspect-[16/9] bg-zinc-200 dark:bg-zinc-800 rounded-2xl animate-pulse" />
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              Nenhuma notícia encontrada
            </h3>
            <p className="text-sm text-zinc-500 mb-6">
              {search || date || category !== "Todos"
                ? "Tente mudar os filtros"
                : "Clique em Atualizar para buscar notícias dos feeds RSS"}
            </p>
            <button
              onClick={handleFetchRSS}
              disabled={fetching}
              className="bg-red-600 text-white text-sm font-bold px-8 py-3 rounded-xl"
            >
              {fetching ? "Buscando..." : "Buscar notícias agora"}
            </button>
          </div>
        )}

        {!loading && featured && <FeaturedCard article={featured} />}

        {!loading && rest.length > 0 && (
          <>
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Mais notícias</span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="space-y-2">
              {rest.map(article => <ArticleCard key={article.id} article={article} />)}
              <button className="text-sm text-red-500 font-semibold hover:text-red-600 transition-colors"
                onClick={() => setShowMore(v => !v)}
              >
                {showMore ? "Ver menos" : "Ver mais"}
              </button>
            </div>
          </>
        )}

        {!loading && articles.length > 0 && page < pages && (
          <>
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Carregar mais</span>
              <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => fetchNews(page + 1)}
                disabled={loading}
                className="bg-red-600 text-white text-sm font-bold px-8 py-3 rounded-xl disabled:opacity-60"
              >
                Ver mais notícias
              </button>
            </div>
          </>
        )}

        <div ref={loaderRef} className="py-6 flex justify-center">
          {page < pages && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <div className="w-4 h-4 border-2 border-zinc-300 border-t-red-500 rounded-full animate-spin" />
              Carregando mais...
            </div>
          )}
          {!loading && page >= pages && articles.length > 0 && (
            <p className="text-xs text-zinc-400 font-medium">{total} notícias carregadas ✓</p>
          )}
        </div>
      </main>

      {/* ── FOOTER ────────────────────────── */}
      <footer className="bg-zinc-900 text-zinc-400 text-center py-6 px-4">
        <p className="text-xs font-bold text-white mb-1">PORTAL GUIMAN NEWS</p>
        <p className="text-[10px]">© 2026 Guiman System · guimansystem.com.br</p>
      </footer>
    </div>
  );
}
