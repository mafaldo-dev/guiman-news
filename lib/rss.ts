import Parser from "rss-parser";

const parser = new Parser({
  timeout: 10000,
  headers: { "User-Agent": "GuimanNews/1.0" },
  customFields: {
    item: [
      ["media:content", "mediaContent", { keepArray: false }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: false }],
      ["enclosure", "enclosure"],
    ],
  },
});

export type ParsedItem = {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  youtubeId?: string;
};

function extractYoutubeId(text: string): string | undefined {
  const match = text.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1];
}

function extractImage(item: Record<string, unknown>): string | undefined {
  const mc = item.mediaContent as Record<string, unknown> | undefined;
  if (mc?.url) return mc.url as string;
  const mt = item.mediaThumbnail as Record<string, unknown> | undefined;
  if (mt?.url) return mt.url as string;
  const enc = item.enclosure as Record<string, unknown> | undefined;
  if (enc?.url && (enc.type as string)?.startsWith("image/")) return enc.url as string;
  const content = String(item["content:encoded"] || item.content || item.summary || "");
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];
  return undefined;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

export async function fetchFeed(url: string): Promise<ParsedItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.slice(0, 15).map((item) => {
      const raw = item as unknown as Record<string, unknown>;
      const description = stripHtml(
        String(raw["content:encoded"] || raw.content || item.contentSnippet || item.summary || "")
      ).slice(0, 400);
      const youtubeId =
        extractYoutubeId(String(item.link || "")) ||
        extractYoutubeId(String(raw["content:encoded"] || raw.content || ""));
      return {
        title: stripHtml(item.title || description || "Sem título"),
        description: description || "Sem descrição disponível.",
        link: item.link || "",
        pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        imageUrl: extractImage(raw),
        youtubeId,
      };
    });
  } catch {
    return [];
  }
}
