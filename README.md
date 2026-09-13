# GitHub Dashboard

A self-hosted GitHub stats card, published as a reusable GitHub Action. It generates an
SVG dashboard with:

- **Total contributions** — the sum of all public contributions (all-time, not just the last year).
- **Top repositories** — the repositories you contribute to most (ranked by the PRs + issues
  you authored), each showing **your PR count** and **your issue count**.

The card is rendered into an SVG and committed to your own repository by a scheduled workflow,
so there is no third-party server involved — you fully self-host it on GitHub Actions.

## Example

```html
<img src="https://raw.githubusercontent.com/shubhamg13/shubhamg13/main/card.svg" alt="GitHub Dashboard" />
```

![GitHub Dashboard](https://raw.githubusercontent.com/shubhamg13/shubhamg13/main/card.svg)

## Quick start

1. In your **profile** repository (e.g. `yourname/yourname`), create
   `.github/workflows/generate-card.yml`:

   ```yaml
   name: Generate GitHub dashboard card
   on:
     schedule:
       - cron: "0 0 * * *" # daily
     workflow_dispatch: {}
     push:
       branches: [main]

   permissions:
     contents: write

   jobs:
     generate:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4

         - name: Generate dashboard card
           uses: shubhamg13/github-dashboard@main
           with:
             username: yourname # omit to default to the repository owner

         - name: Commit the card
           run: |
             git config user.name "github-actions[bot]"
             git config user.email "github-actions[bot]@users.noreply.github.com"
             git add card.svg
             git diff --cached --quiet || git commit -m "chore: update dashboard card"
             git push
   ```

2. Reference the generated file in your `README.md`:

   ```markdown
   <img src="https://raw.githubusercontent.com/yourname/yourname/main/card.svg" alt="GitHub Dashboard" />
   ```

3. Run the workflow once from the **Actions** tab (or wait for the schedule) to create
   `card.svg`, then push the workflow file so the schedule takes effect.

## Inputs

| Input       | Description                                                              | Default              |
| ----------- | ------------------------------------------------------------------------ | -------------------- |
| `username`  | GitHub username to generate the card for.                                | repository owner     |
| `token`     | GitHub token used for API requests (public data only).                   | `${{ github.token }}`|
| `output`    | Path to write the generated SVG.                                         | `card.svg`           |
| `count`     | Number of top repositories to list (1–10).                               | `5`                  |
| `theme`     | Card theme: `catppuccin`, `tokyo-night`, or `github-dark`.               | `catppuccin`         |

## How it works

- **All-time contributions** are computed by summing the `contributionsCollection` for each
  year since the account was created (each query stays under the API's one-year window).
- **Top repos + your PR/issues** come from the search API (`type:pr author:USER` and
  `type:issue author:USER`), aggregated per repository and ranked by total PRs + issues.

## Requirements

- Node.js 20+ (the GitHub-hosted `ubuntu-latest` runner already provides it).
- No npm dependencies — the action uses Node's built-in `fetch`.

## Limitations

- The GitHub search API returns at most 1000 results per query, so the per-repo PR/issue
  counts are exact for the most recent 1000 PRs and 1000 issues you authored.
- The card reflects **public** contributions only (what other people see on your profile).

## License

[MIT](LICENSE)
