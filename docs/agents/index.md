# Agents

How agents work in this repo. What the codebase does is in the spec, not here.

## Reading order

1. The kit glossary, `.shipyard/core/glossary.md`
2. The repo's glossary, `docs/context.md`
3. The spec index, `docs/product/index.md`
4. This file

## Rules

- CI runs `pnpm build` and `pnpm test` on every PR and every push to `main`, so keep the settings file's check and test commands the same as CI's: a local pass then predicts CI's result.
- Every push to `main` redeploys the demo to GitHub Pages, so a merge is a deploy, even for a docs-only PR.
- Pushing a `v*` tag builds, tests and publishes the package to npm, so a tag is a release.

## House rules

### Plans

- Delete the plan file when the plan is done; its PR keeps the record.
- Never mention a plan file in the spec or other docs, such as the README. Docs describe the codebase, not the work that changed it, and the plan file is deleted when done.
- Keep no ADRs or PR template.
- Intended work lives in plans, not GitHub issues. Visitors can still report bugs in issues, since the package links there.
- Each plan merges as soon as it is done; plans are never held to merge together.

### Git

- Trunk only: no `develop`, release branches or back-merges.
- Squash merges. The squash commit message is the PR title in conventional form.
- Delete branches after merge.

## Building plans

This repo doesn't take the building module. An interactive agent builds each approved plan, with the plan's human watching.

- The interactive agent adds the phases, builds and verifies each one, and keeps the plan record, using the plan format in `.shipyard/core/plans.md` and the practices in `.shipyard/core/practices/`.
- It adds no phase estimates, since nothing here compares them with a run.

The plan's PR takes this shape:

| Field | Plan's PR |
| --- | --- |
| Who opens it | The planning agent, at the end of the planning workflow, from the plan's branch |
| Branch | The plan's branch, named by `branches.plan` in the settings file. It holds the plan file and all of the plan's work |
| What it may touch | The plan file and what its phases name |
| Review | The plan's human, against the plan's Changes and the spec |
| Verification evidence | What each Change's Evidence line names, captured by the interactive agent and shown to the plan's human. The PR gets only verification lines |
| Merge | The plan's human, once each Change is verified |

## Commands

See `commands` in `.shipyard/settings.yml`.
