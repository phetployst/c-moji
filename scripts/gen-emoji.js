import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const RAW_PATH = path.join(ROOT, "raw/emojis.json");
const OUT_DIR = path.join(ROOT, "data");
const OUT_FILE = path.join(OUT_DIR, "emojis.json");

// helper: unified -> emoji
function unifiedToEmoji(unified) {
  return unified
    .split("-")
    .map(u => String.fromCodePoint(parseInt(u, 16)))
    .join("");
}

// ensure output dir
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// read raw dataset
const rawText = fs.readFileSync(RAW_PATH, "utf8").trim();
if (!rawText) {
  console.error("raw/emojis.json is empty");
  process.exit(1);
}

const raw = JSON.parse(rawText);

// group by category
const categories = {};

raw.forEach(e => {
  if (!e.unified || !e.category) return;

  const emoji = unifiedToEmoji(e.unified);

  if (!categories[e.category]) {
    categories[e.category] = [];
  }

  const skinVariations = e.skin_variations
    ? Object.values(e.skin_variations).map(v =>
        unifiedToEmoji(v.unified)
      )
    : null;

  categories[e.category].push({
    symbol: emoji,
    name: e.name.toLowerCase(),
    skins: skinVariations
  });
});

const CATEGORY_ORDER = [
  "Smileys & Emotion",
  "People & Body",
  "Animals & Nature",
  "Food & Drink",
  "Travel & Places",
  "Activities",
  "Objects",
  "Symbols",
  "Flags"
];

// format for frontend
const result = CATEGORY_ORDER
  .filter(title => categories[title])
  .map(title => ({
    id: title.toLowerCase().replace(/[^a-z]+/g, "-"),
    title,
    items: categories[title]
  }));

fs.writeFileSync(OUT_FILE, JSON.stringify(result, null, 2), "utf8");

console.log("generated:", OUT_FILE);
