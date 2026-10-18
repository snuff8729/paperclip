# Personal fork workflow

This fork keeps user-specific changes while continuing to receive official
Paperclip updates. Use Git commits and branches to preserve customizations.
The existing `patches/` directory is for dependency patches; do not use it as
an archive of this fork's application changes.

## Repository and branch roles

| Name | Role |
| --- | --- |
| `origin` | Personal fork: `https://github.com/snuff8729/paperclip.git` |
| `upstream` | Official source: `https://github.com/paperclipai/paperclip.git` |
| `main` | Personal integration branch used for normal development and use |
| Local `master` | Original baseline, tracking `upstream/master`; no personal feature commits |
| `feature/*`, `fix/*`, `docs/*` | One purpose per branch, starting from personal `main` |
| `sync/upstream-YYYY-MM-DD` | Official update integration and verification |

Push to `origin` by default. The local `upstream` push URL is deliberately
`DISABLED`; fetching official changes still uses its normal HTTPS URL.
Published `main` history must remain intact. Use merge commits for official
updates; do not repeatedly rebase the accumulated customizations.

## Set up another checkout

```powershell
git clone https://github.com/snuff8729/paperclip.git
cd paperclip
git remote add upstream https://github.com/paperclipai/paperclip.git
git remote set-url --push upstream DISABLED
git config --local remote.pushDefault origin
gh repo set-default snuff8729/paperclip
git fetch upstream master
```

The personal fork's default branch is `main`. Check `git remote -v` and
`git branch -vv` before the first push. Git remote configuration belongs to
each checkout and does not travel with commits.

Install pnpm at the version specified by `package.json`'s `packageManager`.
The repository `.npmrc` selects the Node.js runtime used by pnpm. Native
Runner source builds also need Rust/Cargo and, on Windows, the Visual Studio
C++ Build Tools. Reopen the terminal after installing tools. Follow
[the development guide](DEVELOPING.md) for the full setup.

## Make a customization

Start with a clean working tree. Commit existing work on its own branch
before switching; keep source changes out of long-lived stashes.

```powershell
git switch main
git pull --ff-only origin main
git switch -c feature/company-dashboard
```

Replace the example branch name with the feature's purpose. Use `fix/*` for
repairs and `docs/*` for documentation. Keep each commit focused enough to
review or revert independently. Prefer separate modules, existing extension
points, and explicit settings when they reduce edits to upstream-owned code.

Run the smallest relevant checks during development. Before a PR-ready
handoff, follow the repository's full verification requirements in
[AGENTS.md](../AGENTS.md#7-verification-before-hand-off). Report any check that
was not run or failed; targeted verification does not establish that the
whole repository passes.

Push the feature branch to `origin` and open its PR against the personal
fork's `main`. Use every section of
[the PR template](../.github/PULL_REQUEST_TEMPLATE.md). Record:

- why the default upstream behavior does not meet the user's purpose;
- which behavior and source areas changed;
- relevant automated checks and manual journeys;
- migration, compatibility, and rollback considerations.

Review and validate the PR before merging. Add or update the customization
inventory below when the change adds or retires a maintained customization.
Feature branches may be rebased before publication if useful; published
`main` is never rebased or force-pushed.

## Bring in official updates

An upstream sync is its own change. Finish or commit other work first. Create
a logical database backup while the current version and its database are
still running, before starting updated code that can apply migrations. The
backup command connects to the existing database; it does not start embedded
PostgreSQL. On Windows the direct CLI avoids the Unix wrapper in
`pnpm db:backup`:

```powershell
pnpm paperclipai db:backup
```

After the logical backup succeeds, stop the instance. Also back up local
instance files such as configuration, encryption keys, and stored
attachments; a logical database backup does not include them.
See [Database backups](DATABASE.md) for coverage and recovery details. Keep
backups and credentials outside the Git repository.

Create the integration branch; replace `YYYY-MM-DD` with today's date:

```powershell
git fetch upstream
git switch main
git pull --ff-only origin main
git switch -c sync/upstream-YYYY-MM-DD
git merge --no-ff upstream/master
```

Review conflicts against the customization inventory. Preserve each
customization's intended behavior rather than automatically choosing one
side. Retire local fixes when the official implementation covers them.
`git merge --abort` cancels an unfinished merge if needed.

```powershell
pnpm install --frozen-lockfile
```

If dependency installation fails, investigate the error. Do not regenerate
or commit `pnpm-lock.yaml`; official repository automation owns that file.
Review upstream's Node.js, pnpm, and Rust requirements and update the fork's
runtime selection when needed. Keep the Windows LF requirements for patch
hashes and generated-source checks intact.

Run the required verification, including the affected customizations, and
verify the app with `pnpm dev` against disposable or backed-up instance data.
Open the sync PR against `origin/main`; describe the upstream revision,
conflict resolutions, retired fixes, migrations, and actual check results.
Merge only after review and verification. Other feature branches can then
merge the updated personal `main` before their own integration.

Use Git revert commits for published code rollback. Database migrations and
instance files need their own recovery plan; reverting code does not revert
instance data.

## Current customization inventory

| Customization | Purpose and affected areas | Verification |
| --- | --- | --- |
| Node runtime selection | `.npmrc` selects Node.js 24.11.0 for pnpm commands; `doc/DEVELOPING.md` records runtime and native build prerequisites. Revisit the pin when upstream raises its requirements. | `pnpm node --version` reports the selected runtime. |
| Windows line endings | `.gitattributes` keeps dependency patches, Runner generator scripts, and their checked outputs in LF so hash and generated-file checks stay stable. Patch contents and expected hashes are unchanged. | Runner `check:acpx-profiles` and `check:protocol-types`. |
| Windows Runner compilation | `process_supervisor.rs` gates verified stdio process launch to Linux/macOS and explicitly rejects unsupported platforms, matching the existing verified-process APIs. | Rust unit test `verified_stdio_launch_rejects_unsupported_platforms` and native Runner build. |
| Portable shared asset build | `packages/shared/scripts/copy-cliplab-assets.mjs` copies the Cliplab license and provenance with Node.js, replacing Unix-only build commands. | Plugin SDK/shared build and matching source/output file hashes. |

## Initial bootstrap: 2026-10-18

The initial Windows changes were made on a checkout of official commit
`63306f666020408f8175886faf54c3ad9ea6b1a2`. Bootstrap preserves that baseline
and integrates the existing fixes and this workflow through purpose-specific
branches and user-authorized local merge commits. Future changes follow the
PR workflow above. Creating the fork does not itself upgrade the application
to a newer official revision.

The initial branches are `fix/windows-dev-compat` (runtime selection commit
`c6db0b0de` and Windows compatibility commit `b4613fb61`) and
`docs/fork-workflow` (this operating procedure and its entry points).

Initial verification covered the three Runner generator checks, the Windows
regression test, Runner TypeScript/native builds, the Plugin SDK/shared build,
and matching copied asset hashes. During the original startup repair, the UI
and companies API returned HTTP 200 and health reported `ok`/`ready`. The
server was then stopped at the user's request.

The repository-wide typecheck, full test suite, and full build were not run
for this bootstrap. Keep this limitation visible; it is not a claim that
all CI checks pass. Do not restart the server merely to organize Git history.
