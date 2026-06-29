export type Article = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string | null;
  articleUrl: string;
  youtubeId?: string | null;
  category: string;
  source: string;
  publishedAt: string;
  createdAt: string;
  clicks: number;
  likes: number;
  shares: number;
  commentCount?: number;
};

export type Comment = {
  id: string;
  articleId: string;
  author: string;
  content: string;
  createdAt: string;
  approved: number;
};

export const CATEGORIES = [
  "Todos", "Geral", "Ciência", "Astronomia", "Economia",
  "Tecnologia", "Música", "Saúde", "Meio Ambiente",
  "Esportes", "Entretenimento", "Política",
];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Geral:         { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  Ciência:       { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  Astronomia:    { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  Economia:      { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  Tecnologia:    { bg: "#FDF4FF", text: "#7E22CE", border: "#E9D5FF" },
  Música:        { bg: "#FFF0F6", text: "#BE185D", border: "#FBCFE8" },
  Saúde:         { bg: "#FFF1F2", text: "#BE123C", border: "#FECDD3" },
  "Meio Ambiente": { bg: "#F0FDF4", text: "#166534", border: "#BBF7D0" },
  Esportes:      { bg: "#FFF7ED", text: "#C2410C", border: "#FED7AA" },
  Entretenimento:{ bg: "#FEFCE8", text: "#A16207", border: "#FEF08A" },
  Política:      { bg: "#F8FAFC", text: "#334155", border: "#E2E8F0" },
};

export const CATEGORY_EMOJI: Record<string, string> = {
  Todos: "🌐", Geral: "📰", Ciência: "🔬", Astronomia: "🚀",
  Economia: "📈", Tecnologia: "💻", Música: "🎵", Saúde: "💊",
  "Meio Ambiente": "🌿", Esportes: "⚽", Entretenimento: "🎬", Política: "🏛️",
};
