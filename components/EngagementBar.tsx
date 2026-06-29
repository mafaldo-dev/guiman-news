"use client";
import { useState, useEffect, useReducer } from "react";
import { Comment } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type CounterState = { likes: number; shares: number; comments: number };
type CounterAction =
  | { type: "SET"; payload: Partial<CounterState> }
  | { type: "INCREMENT"; field: keyof CounterState };

function counterReducer(state: CounterState, action: CounterAction): CounterState {
  switch (action.type) {
    case "SET": return { ...state, ...action.payload };
    case "INCREMENT": return { ...state, [action.field]: state[action.field] + 1 };
    default: return state;
  }
}

function timeAgo(d: string) {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR }); }
  catch { return ""; }
}

export function EngagementBar({
  articleId,
  initialLikes,
  initialShares,
  initialComments,
}: {
  articleId: string;
  initialLikes: number;
  initialShares: number;
  initialComments: number;
}) {
  const [state, dispatch] = useReducer(counterReducer, {
    likes: initialLikes,
    shares: initialShares,
    comments: initialComments,
  });
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newAuthor, setNewAuthor] = useState("");
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);

  async function handleLike() {
    if (liked) return;
    setLiked(true);
    dispatch({ type: "INCREMENT", field: "likes" });
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, type: "like" }),
    });
  }

  async function handleShare() {
    dispatch({ type: "INCREMENT", field: "shares" });
    await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, type: "share" }),
    });
    if (navigator.share) {
      try { await navigator.share({ title: document.title, url: window.location.href }); }
      catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
  }

  async function loadComments() {
    setLoadingComments(true);
    const res = await fetch(`/api/comments?articleId=${articleId}`);
    const data = await res.json();
    setComments(data.comments || []);
    setLoadingComments(false);
  }

  function toggleComments() {
    if (!showComments && comments.length === 0) loadComments();
    setShowComments((v) => !v);
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId, author: newAuthor, content: newContent }),
    });
    const data = await res.json();
    if (data.ok) {
      setComments((prev) => [data.comment, ...prev]);
      dispatch({ type: "INCREMENT", field: "comments" });
      setNewContent("");
      setNewAuthor("");
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
      {/* Action bar */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            liked
              ? "bg-red-50 text-red-500 dark:bg-red-950/30"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <span className={`text-base transition-transform ${liked ? "scale-125" : ""}`}>
            {liked ? "❤️" : "🤍"}
          </span>
          <span>{state.likes}</span>
        </button>

        <button
          onClick={toggleComments}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            showComments
              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30"
              : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }`}
        >
          <span className="text-base">💬</span>
          <span>{state.comments}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <span className="text-base">🔗</span>
          <span>{state.shares}</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 space-y-3">
          {/* New comment form */}
          <form onSubmit={submitComment} className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-2">Deixar comentário</p>
            <input
              type="text"
              placeholder="Seu nome (opcional)"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
              className="w-full text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 mb-2 outline-none focus:ring-2 focus:ring-blue-500/30 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
            <textarea
              placeholder="Escreva seu comentário..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              rows={2}
              required
              className="w-full text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 mb-2 outline-none focus:ring-2 focus:ring-blue-500/30 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
            />
            <button
              type="submit"
              disabled={submitting || !newContent.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? "Enviando..." : "Comentar"}
            </button>
          </form>

          {/* Comments list */}
          {loadingComments ? (
            <div className="space-y-2">
              {[1,2].map(i => <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />)}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">Seja o primeiro a comentar!</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{c.author}</span>
                    <span className="text-[10px] text-zinc-400">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
