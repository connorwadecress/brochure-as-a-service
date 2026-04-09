# Development Environment

## Platform

- Windows 11 Enterprise
- Shell: bash (Git Bash) — use Unix syntax
- Node.js for engine, Python 3 for pipeline

## Claude Code Configuration

- `.claude/launch.json` — Dev server config: `npx serve ../sites/example -l 3456 --no-clipboard` (port 3456)
- `.claude/settings.local.json` — Permission allowlist for specific commands

## Serena MCP

- Registered as MCP server with `--context claude-code --project-from-cwd`
- Memories stored in `.serena/memories/`
- Project config in `.serena/project.yml`

## Required Environment Variables

- `ANTHROPIC_API_KEY` — For site generation via Claude API (create-site.js)

## Required Config Files (not committed)

- `pipeline/config.json` — Google Places API key (copy from `config.example.json`)
