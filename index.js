import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import { fetchAllTimeContributions, fetchTopRepos } from "./lib/fetch.js";
import { renderCard } from "./lib/render.js";
import { THEME_NAMES } from "./lib/themes.js";

async function main() {
  const username = (
    process.env.INPUT_USERNAME ||
    process.env.GITHUB_REPOSITORY_OWNER ||
    ""
  ).trim();

  const token = (process.env.INPUT_TOKEN || process.env.GITHUB_TOKEN || "").trim();
  const output = (process.env.INPUT_OUTPUT || "card.svg").trim();
  const count = Math.max(1, Math.min(10, parseInt(process.env.INPUT_COUNT || "5", 10) || 5));
  const requestedTheme = (process.env.INPUT_THEME || "catppuccin").trim();

  if (!username) {
    console.error("Error: no username provided and GITHUB_REPOSITORY_OWNER is not set.");
    process.exit(1);
  }
  if (!token) {
    console.error("Error: no GitHub token provided.");
    process.exit(1);
  }

  const themeName = THEME_NAMES.includes(requestedTheme) ? requestedTheme : "catppuccin";
  console.log(`Generating dashboard for "${username}" (theme=${themeName}, count=${count})`);

  const [totalContributions, repos] = await Promise.all([
    fetchAllTimeContributions(token, username),
    fetchTopRepos(token, username, count),
  ]);

  const svg = renderCard({ totalContributions, repos, themeName });

  const outPath = path.resolve(process.cwd(), output);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${svg}\n`, "utf8");

  console.log(`Total contributions: ${totalContributions}`);
  console.log(
    `Top repos: ${
      repos.length
        ? repos.map((r) => `${r.repo} (PRs=${r.prs}, issues=${r.issues})`).join(", ")
        : "none found"
    }`,
  );
  console.log(`Wrote ${outPath}`);
}

main().catch((err) => {
  console.error(err && err.message ? err.message : err);
  process.exit(1);
});
