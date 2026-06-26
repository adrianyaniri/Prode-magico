# Skill Registry — mundial-prode

Generated: 2026-06-24
Scope: user-level (no project-level skills found)

## Convention Files

| File | Path |
|------|------|
| AGENTS.md (opencode) | `~/.config/opencode/AGENTS.md` |

## User Skills

### opencode skills (`~/.config/opencode/skills/`)

| Name | Trigger | Path |
|------|---------|------|
| branch-pr | Creating, opening, or preparing PRs for review | `~/.config/opencode/skills/branch-pr/SKILL.md` |
| chained-pr | PRs over 400 lines, stacked PRs, review slices | `~/.config/opencode/skills/chained-pr/SKILL.md` |
| cognitive-doc-design | Writing guides, READMEs, RFCs, onboarding, architecture, or review-facing docs | `~/.config/opencode/skills/cognitive-doc-design/SKILL.md` |
| comment-writer | PR feedback, issue replies, reviews, Slack messages, or GitHub comments | `~/.config/opencode/skills/comment-writer/SKILL.md` |
| customize-opencode | Editing or creating opencode's own configuration | `<built-in>` |
| go-testing | Go tests, go test coverage, Bubbletea teatest, golden files | `~/.config/opencode/skills/go-testing/SKILL.md` |
| issue-creation | Creating GitHub issues, bug reports, or feature requests | `~/.config/opencode/skills/issue-creation/SKILL.md` |
| judgment-day | Judgment day, dual review, adversarial review, juzgar | `~/.config/opencode/skills/judgment-day/SKILL.md` |
| work-unit-commits | Implementation, commit splitting, chained PRs, or keeping tests and docs with code | `~/.config/opencode/skills/work-unit-commits/SKILL.md` |

### agent skills (`~/.agents/skills/`)

| Name | Trigger | Path |
|------|---------|------|
| docker-expert | Docker containerization, optimization, security, multi-stage builds, orchestration | `~/.agents/skills/docker-expert/SKILL.md` |
| e2e-testing-patterns | Implementing E2E tests, debugging flaky tests, or establishing testing standards | `~/.agents/skills/e2e-testing-patterns/SKILL.md` |
| find-skills | "how do I do X", "find a skill for X", "is there a skill that can..." | `~/.agents/skills/find-skills/SKILL.md` |
| keycloak-administration | Configuring KeyCloak, setting up SSO, managing realms, IAM configuration | `~/.agents/skills/keycloak-administration/SKILL.md` |
| monorepo-management | Setting up monorepos, optimizing builds, or managing shared dependencies | `~/.agents/skills/monorepo-management/SKILL.md` |
| nestjs-best-practices | Writing, reviewing, or refactoring NestJS code | `~/.agents/skills/nestjs-best-practices/SKILL.md` |
| postgresql-table-design | Designing or reviewing a PostgreSQL-specific schema | `~/.agents/skills/postgresql-table-design/SKILL.md` |
| prisma-database-setup | Setting up a new project with Prisma, changing databases, or troubleshooting connection issues | `~/.agents/skills/prisma-database-setup/SKILL.md` |
| tailwind-design-system | Creating component libraries, implementing design systems, or standardizing UI patterns | `~/.agents/skills/tailwind-design-system/SKILL.md` |
| vercel-react-best-practices | React components, Next.js pages, data fetching, bundle optimization, or performance improvements | `~/.agents/skills/vercel-react-best-practices/SKILL.md` |

## Excluded from Index

Skills starting with `sdd-*`, `_shared`, and `skill-registry` are excluded per scan rules (SDD workflow skills managed by orchestrator).

## Notes

- Deduplication: project-level skills preferred over user-level; none found at project level.
- All user-level skills resolved from `~/.config/opencode/skills/`, `~/.agents/skills/`, and `~/.claude/skills/`.
- SDD skills (`sdd-init`, `sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`, `sdd-onboard`) are managed by the orchestrator and excluded from this registry.
