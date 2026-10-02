import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../pool.js";
import { upsertQuestion } from "../../repositories/question.repository.js";
import { normalizeLeetCodeProblem } from "./importers/leetcodeNormalizer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is 4 levels up: server/src/db/seeds -> server/src/db -> server/src -> server -> root
const rootDir = path.resolve(__dirname, "../../../../");
const dataDir = path.join(rootDir, "data", "leetcode");
const rawDir = path.join(dataDir, "raw");
const curatedSlugsPath = path.join(dataDir, "curated_slugs.json");
const slugToFilePath = path.join(dataDir, "slug_to_file.json");

const GITHUB_RAW_BASE =
  "https://raw.githubusercontent.com/neenza/leetcode-problems/master";

async function fetchWithRetry(url: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
      }
      return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

async function seedQuestions(): Promise<void> {
  console.log("=== Starting Questions Seed Pipeline ===");

  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }

  // 1. Load curated slugs
  if (!fs.existsSync(curatedSlugsPath)) {
    throw new Error(`Missing curated slugs file: ${curatedSlugsPath}`);
  }
  const curatedSlugsRaw = fs.readFileSync(curatedSlugsPath, "utf8").replace(/^\uFEFF/, "");
  const curatedSlugs: string[] = JSON.parse(curatedSlugsRaw);

  console.log(`Loaded ${curatedSlugs.length} curated slugs.`);

  // 2. Load slug to file mapping
  let slugToFile: Record<string, string> = {};
  if (fs.existsSync(slugToFilePath)) {
    const rawMapping = fs.readFileSync(slugToFilePath, "utf8").replace(/^\uFEFF/, "");
    slugToFile = JSON.parse(rawMapping);
  }

  let insertedOrUpdated = 0;

  for (let i = 0; i < curatedSlugs.length; i++) {
    const slug = curatedSlugs[i]!;
    const rawFilePath = path.join(rawDir, `${slug}.json`);

    let rawJsonContent: string;

    if (fs.existsSync(rawFilePath)) {
      rawJsonContent = fs.readFileSync(rawFilePath, "utf8").replace(/^\uFEFF/, "");
    } else {
      const relPath = slugToFile[slug];
      if (!relPath) {
        throw new Error(`No file mapping found for slug "${slug}"`);
      }
      const fileUrl = `${GITHUB_RAW_BASE}/${relPath}`;
      console.log(`[${i + 1}/${curatedSlugs.length}] Downloading: ${slug} from ${fileUrl}`);
      rawJsonContent = await fetchWithRetry(fileUrl);
      fs.writeFileSync(rawFilePath, rawJsonContent, "utf8");
    }

    const rawData = JSON.parse(rawJsonContent);

    // 3. Normalize & Validate
    const validatedInput = normalizeLeetCodeProblem(rawData);

    // 4. Upsert into PostgreSQL
    await upsertQuestion(validatedInput);
    insertedOrUpdated++;

    console.log(
      `[${i + 1}/${curatedSlugs.length}] Synced: "${validatedInput.title}" (${validatedInput.slug}) [${validatedInput.difficulty} | ${validatedInput.topic}]`
    );
  }

  console.log(`\nSuccessfully processed and upserted ${insertedOrUpdated} questions.`);
}

seedQuestions()
  .catch((err) => {
    console.error("Seed pipeline failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
