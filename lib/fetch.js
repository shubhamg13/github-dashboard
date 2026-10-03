/**
 * GitHub API clients (GraphQL + REST) using Node's built-in fetch. No dependencies.
 */

import { CREATED_AT_QUERY, CONTRIBUTIONS_QUERY } from "./queries.js";

const GRAPHQL_URL = "https://api.github.com/graphql";
const REST_URL = "https://api.github.com";

const HEADERS = (token) => ({
  Authorization: `bearer ${token}`,
  "User-Agent": "github-dashboard",
});

/**
 * Run a GraphQL query and return `data` (throws on HTTP or GraphQL errors).
 * @param {string} token
 * @param {string} query
 * @param {Record<string, unknown>} variables
 */
export async function graphql(token, query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      ...HEADERS(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }

  return json.data;
}

/**
 * Sum of all-time public contributions, obtained by walking the
 * `contributionsCollection` year by year (split into ~6 month ranges so we
 * never exceed the API's one-year window).
 * @param {string} token
 * @param {string} username
 * @returns {Promise<number>}
 */
export async function fetchAllTimeContributions(token, username) {
  const data = await graphql(token, CREATED_AT_QUERY, { login: username });
  const createdAt = data?.user?.createdAt;

  if (!createdAt) {
    throw new Error(`Could not find user "${username}" (or it has no public contributions).`);
  }

  const startYear = new Date(createdAt).getUTCFullYear();
  const endYear = new Date().getUTCFullYear();
  const nowIso = new Date().toISOString();

  let total = 0;

  for (let year = startYear; year <= endYear; year++) {
    // Two ~6-month chunks per year keeps every range safely under 1 year.
    const ranges = [
      { from: `${year}-01-01T00:00:00Z`, to: `${year}-07-01T00:00:00Z` },
      { from: `${year}-07-01T00:00:00Z`, to: `${year + 1}-01-01T00:00:00Z` },
    ];

    for (const range of ranges) {
      if (range.from >= nowIso) continue; // whole range is in the future
      const to = range.to > nowIso ? nowIso : range.to;
      if (to <= range.from) continue;

      const result = await graphql(token, CONTRIBUTIONS_QUERY, {
        login: username,
        from: range.from,
        to,
      });

      total += result.user.contributionsCollection.contributionCalendar.totalContributions;
    }
  }

  return total;
}

/**
 * Aggregate, per repository, the number of PRs or issues authored by the user.
 * @param {string} token
 * @param {string} username
 * @param {"pr" | "issue"} type
 * @returns {Promise<{ total: number, byRepo: Map<string, number> }>}
 */
async function searchByRepo(token, username, type) {
  const byRepo = new Map();
  let total = 0;
  let page = 1;
  const perPage = 100;

  while (page <= 10) {
    // Search API returns at most 1000 results per query.
    const q = encodeURIComponent(`type:${type} author:${username}`);
    const url = `${REST_URL}/search/issues?q=${q}&per_page=${perPage}&page=${page}`;

    const res = await fetch(url, {
      headers: {
        ...HEADERS(token),
        Accept: "application/vnd.github+json",
      },
    });

    if (res.status === 422) break; // "only first 1000 results are available" signal
    if (!res.ok) {
      throw new Error(`Search request failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    total = json.total_count ?? total;

    const items = json.items ?? [];
    for (const item of items) {
      // item.repository_url looks like: https://api.github.com/repos/owner/repo
      const repo = (item.repository_url || "")
        .replace(`${REST_URL}/repos/`, "")
        .replace("https://api.github.com/repos/", "");
      if (repo) {
        byRepo.set(repo, (byRepo.get(repo) || 0) + 1);
      }
    }

    if (items.length < perPage) break;
    page++;
  }

  return { total, byRepo };
}

/**
 * Build the "top repos" table data: repos ranked by the number of PRs + issues
 * the user authored, each with the PR and issue counts.
 * @param {string} token
 * @param {string} username
 * @param {number} count
 * @param {object} [options]
 * @param {boolean} [options.excludeOwn] Exclude repositories owned by the username.
 * @returns {Promise<Array<{ repo: string, prs: number, issues: number, total: number }>>}
 */
export async function fetchTopRepos(token, username, count, { excludeOwn = false } = {}) {
  const [prs, issues] = await Promise.all([
    searchByRepo(token, username, "pr"),
    searchByRepo(token, username, "issue"),
  ]);

  const merged = new Map();
  for (const [repo, n] of prs.byRepo) {
    merged.set(repo, { repo, prs: n, issues: 0 });
  }
  for (const [repo, n] of issues.byRepo) {
    const entry = merged.get(repo) || { repo, prs: 0, issues: 0 };
    entry.issues = n;
    merged.set(repo, entry);
  }

  const ownPrefix = username.toLowerCase() + "/";

  return [...merged.values()]
    .filter((entry) => {
      if (!excludeOwn) return true;
      return !entry.repo.toLowerCase().startsWith(ownPrefix);
    })
    .map((entry) => ({ ...entry, total: entry.prs + entry.issues }))
    .sort((a, b) => b.total - a.total)
    .slice(0, count);
}
