import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const FEEDS = [
  { name: "MIT News — Artificial Intelligence", url: "https://news.mit.edu/topic/mitartificial-intelligence2-rss.xml" },
  { name: "Ars Technica — AI & Tech", url: "https://feeds.arstechnica.com/arstechnica/technology-lab" }
];

function extractTag(block, tag) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!match) return "";
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRssItems(xml, sourceName) {
  const items = [];
  const itemMatches = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const rawItem of itemMatches.slice(0, 6)) {
    const title = extractTag(rawItem, "title");
    const link = extractTag(rawItem, "link");
    const pubDate = extractTag(rawItem, "pubDate");
    const description = extractTag(rawItem, "description");
    if (title && link) {
      items.push({
        source: sourceName,
        title,
        link,
        pubDate,
        summaryDraft: description.slice(0, 280),
        status: "osnutek"
      });
    }
  }
  return items;
}

async function main() {
  const allDrafts = [];
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, { headers: { "User-Agent": "AIDnevnikDraftBot/1.0" } });
      if (!res.ok) {
        console.warn(`Preskočen vir ${feed.name}: HTTP ${res.status}`);
        continue;
      }
      const xml = await res.text();
      allDrafts.push(...parseRssItems(xml, feed.name));
    } catch (err) {
      console.warn(`Napaka pri branju ${feed.name}:`, err.message);
    }
  }

  const outPath = path.join(ROOT, "content", "drafts.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify({ fetchedAt: new Date().toISOString(), count: allDrafts.length, drafts: allDrafts }, null, 2),
    "utf8"
  );
  console.log(`Shranjenih ${allDrafts.length} osnutkov v content/drafts.json.`);
}

main();
