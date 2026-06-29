"use client";
import { useState, useEffect, useCallback } from "react";

type Stats = {
  total: number; clicks: number; likes: number; shares: number; comments: number; feeds: number;
};
type Article = {
  id: string; title: string; category: string;
  clicks: number; likes: number; shares: number; commentCount: number; publishedAt: string;
};
type Comment = {
  id: string; author: string; content: string; createdAt: string;
  articleTitle: string; articleId: string; approved: number;
};
type Feed = { id: string; url: string; category: string; name: string; active: number; };

type Tab = "stats" | "articles" | "comments" | "feeds";

function fmt(n: number | string | null) {
  const num = Number(n || 0);
  return num >= 1000 ? `${(num / 1000).toFixed(1)}k` : String(num);
}

function timeStr(d: string) {
  try { return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  catch { return d; }
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [pwErr, setPwErr] = useState(false);
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<Stats | null>(null);
  const [topClicked, setTopClicked] = useState<Article[]>([]);
  const [recentComments, setRecentComments] = useState<Comment[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesTotal, setArticlesTotal] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRSS, setFetchingRSS] = useState(false);

  const [secret, setSecret] = useState("");

  async function login() {
    const res = await fetch(`/api/admin?action=stats&secret=${pw}`);
    if (res.ok) {
      setSecret(pw);
      setAuthed(true);
      const data = await res.json();
      setStats(data.stats);
      setTopClicked(data.topClicked || []);
      setRecentComments(data.recentComments || []);
    } else {
      setPwErr(true);
    }
  }

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    if (t === "stats") {
      const res = await fetch(`/api/admin?action=stats&secret=${secret}`);
      const d = await res.json();
      setStats(d.stats); setTopClicked(d.topClicked || []); setRecentComments(d.recentComments || []);
    } else if (t === "articles") {
      const res = await fetch(`/api/admin?action=articles&secret=${secret}`);
      const d = await res.json();
      setArticles(d.articles || []); setArticlesTotal(Number(d.total || 0));
    } else if (t === "comments") {
      const res = await fetch(`/api/admin?action=comments&secret=${secret}`);
      const d = await res.json();
      setComments(d.comments || []);
    } else if (t === "feeds") {
      const res = await fetch(`/api/admin?action=feeds&secret=${secret}`);
      const d = await res.json();
      setFeeds(d.feeds || []);
    }
    setLoading(false);
  }, [secret]);

  useEffect(() => { if (authed) loadTab(tab); }, [tab, authed, loadTab]);

  async function deleteComment(id: string) {
    if (!confirm("Deletar comentário?")) return;
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action: "delete_comment", id }) });
    setComments(prev => prev.filter(c => c.id !== id));
    setRecentComments(prev => prev.filter(c => c.id !== id));
  }

  async function deleteArticle(id: string) {
    if (!confirm("Deletar notícia e seus comentários?")) return;
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action: "delete_article", id }) });
    setArticles(prev => prev.filter(a => a.id !== id));
  }

  async function toggleFeed(id: string, active: number) {
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action: "toggle_feed", id, active: !active }) });
    setFeeds(prev => prev.map(f => f.id === id ? { ...f, active: active ? 0 : 1 } : f));
  }

  async function handleFetchRSS() {
    setFetchingRSS(true);
    await fetch(`/api/fetch-news?secret=${secret}`);
    await loadTab("stats");
    setFetchingRSS(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-zinc-900 rounded-2xl p-8 border border-zinc-800">
          <div className="text-center mb-6">
            <div className="text-3xl mb-2">🛡️</div>
            <h1 className="text-xl font-black text-white tracking-tight">Admin</h1>
            <p className="text-xs text-zinc-500 mt-1">PORTAL GUIMAN NEWS</p>
          </div>
          <input
            type="password"
            placeholder="Senha de acesso"
            value={pw}
            onChange={e => { setPw(e.target.value); setPwErr(false); }}
            onKeyDown={e => e.key === "Enter" && login()}
            className={`w-full bg-zinc-800 border rounded-xl px-4 py-3 text-white text-sm outline-none mb-3 ${
              pwErr ? "border-red-500" : "border-zinc-700 focus:border-red-500"
            }`}
          />
          {pwErr && <p className="text-red-400 text-xs mb-3 text-center">Senha incorreta</p>}
          <button
            onClick={login}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Entrar
          </button>
          <p className="text-center text-xs text-zinc-600 mt-4">
            Senha padrão: <span className="text-zinc-500 font-mono">guiman2024</span>
          </p>
        </div>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "stats", label: "Dashboard", icon: "📊" },
    { id: "articles", label: "Notícias", icon: "📰" },
    { id: "comments", label: "Comentários", icon: "💬" },
    { id: "feeds", label: "Feeds RSS", icon: "📡" },
  ];

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-0.5">Painel Admin</p>
            <h1 className="text-base font-black text-white">
              <span className="text-red-700">PORTAL</span> GUIMAN NEWS
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchRSS}
              disabled={fetchingRSS}
              className="flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-3 py-2 rounded-lg disabled:opacity-60"
            >
              <span className={fetchingRSS ? "animate-spin inline-block" : ""}>↻</span>
              {fetchingRSS ? "Buscando..." : "Buscar RSS"}
            </button>
            <a href="/" className="text-xs text-zinc-400 px-3 py-2 rounded-lg bg-zinc-800">← Portal</a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide bg-zinc-900 border-b border-zinc-800">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? "border-red-500 text-white bg-zinc-800/50"
                : "border-transparent text-zinc-500"
            }`}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-16 bg-zinc-800 rounded-xl animate-pulse" />)}
          </div>
        )}

        {/* ── STATS ─────────────────────── */}
        {!loading && tab === "stats" && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Notícias", value: fmt(stats.total), icon: "📰", color: "border-blue-500" },
                { label: "Cliques totais", value: fmt(stats.clicks), icon: "👆", color: "border-yellow-500" },
                { label: "Curtidas", value: fmt(stats.likes), icon: "❤️", color: "border-red-500" },
                { label: "Compartilhamentos", value: fmt(stats.shares), icon: "🔗", color: "border-green-500" },
                { label: "Comentários", value: fmt(stats.comments), icon: "💬", color: "border-purple-500" },
                { label: "Feeds ativos", value: fmt(stats.feeds), icon: "📡", color: "border-orange-500" },
              ].map(s => (
                <div key={s.label} className={`bg-zinc-900 rounded-xl p-3 border-l-4 ${s.color}`}>
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="text-xl font-black text-white">{s.value}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>

            {topClicked.length > 0 && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                  🏆 Top 10 mais clicadas
                </h3>
                <div className="space-y-2">
                  {topClicked.map((a, i) => (
                    <div key={a.id} className="flex items-start gap-3">
                      <span className="text-xs font-black text-zinc-600 w-4 flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-300 font-medium line-clamp-2 leading-snug">{a.title}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-zinc-600">
                          <span>{a.category}</span>
                          <span>👆 {a.clicks}</span>
                          <span>❤️ {a.likes}</span>
                          <span>🔗 {a.shares}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {recentComments.length > 0 && (
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                  💬 Comentários recentes
                </h3>
                <div className="space-y-2">
                  {recentComments.slice(0, 8).map(c => (
                    <div key={c.id} className="border-b border-zinc-800 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-zinc-300">{c.author}</span>
                        <span className="text-[10px] text-zinc-600">{timeStr(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-1">{c.content}</p>
                      <p className="text-[10px] text-zinc-700 mt-0.5 line-clamp-1">↳ {c.articleTitle}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ARTICLES ──────────────────── */}
        {!loading && tab === "articles" && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">{articlesTotal} notícias no banco</p>
            {articles.map(a => (
              <div key={a.id} className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-wide">{a.category}</span>
                    <p className="text-xs text-zinc-300 font-medium leading-snug line-clamp-2 mt-0.5">{a.title}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-600">
                      <span>👆 {a.clicks}</span>
                      <span>❤️ {a.likes}</span>
                      <span>🔗 {a.shares}</span>
                      <span>💬 {a.commentCount}</span>
                      <span>· {timeStr(a.publishedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteArticle(a.id)}
                    className="text-zinc-600 hover:text-red-400 text-base flex-shrink-0 px-1"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── COMMENTS ──────────────────── */}
        {!loading && tab === "comments" && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">{comments.length} comentários</p>
            {comments.length === 0 && (
              <div className="text-center py-12 text-zinc-600 text-sm">Nenhum comentário ainda</div>
            )}
            {comments.map(c => (
              <div key={c.id} className="bg-zinc-900 rounded-xl p-3 border border-zinc-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-zinc-300">{c.author}</span>
                      <span className="text-[10px] text-zinc-600">{timeStr(c.createdAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed mb-1">{c.content}</p>
                    <p className="text-[10px] text-zinc-700 line-clamp-1">↳ {c.articleTitle}</p>
                  </div>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-zinc-600 hover:text-red-400 text-base flex-shrink-0 px-1"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FEEDS ─────────────────────── */}
        {!loading && tab === "feeds" && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 font-medium">{feeds.length} feeds configurados</p>
            {feeds.map(f => (
              <div key={f.id} className={`rounded-xl p-3 border transition-all ${
                f.active ? "bg-zinc-900 border-zinc-700" : "bg-zinc-950 border-zinc-800 opacity-60"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-zinc-300">{f.name}</span>
                      <span className="text-[10px] font-bold text-red-400">{f.category}</span>
                    </div>
                    <p className="text-[10px] text-zinc-600 truncate">{f.url}</p>
                  </div>
                  <button
                    onClick={() => toggleFeed(f.id, f.active)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors ${
                      f.active
                        ? "bg-green-900/50 text-green-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {f.active ? "Ativo" : "Inativo"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
