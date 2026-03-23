# joseandgoose-site-main

Personal website at joseandgoose.com built with Next.js 16, TypeScript, and Tailwind CSS 4, deployed on Vercel. Features include writing posts, the Numerator number-guessing game, the Fruit Exchange community tree map, and TL;DR by Goose (static AI-generated post summaries). Supabase handles game and form data.

## Version Control
- Semver: patch for content/style fixes, minor for new features or pages
- Commit format: `type: short description` (types: feat, fix, chore, docs, refactor)
- Run `/wrap` at the end of every session to update CHANGELOG.md, commit, and push
- Always test locally with `npm run dev` at localhost:3000 before deploying

## Deployment
- Hosted on Vercel — deploy with `vercel` CLI from this folder
- Do NOT use `git pull` — remote is a starter/archive, local history is authoritative

## Secrets
- All credentials in `.env.local` via `process.env.*` — never hardcode
- `.env.local` is gitignored — do not track it

## Rollback
- Find commit: `git log --oneline`
- Undo a commit: `git revert <hash>`
