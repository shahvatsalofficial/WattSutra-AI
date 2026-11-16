# Developer experience / quickstart

Prerequisite: Node.js 22+; network access is not needed for `npm test` in the dependency-free starter.

`npm run doctor`: runtime/OS readiness. `npm run demo`: baseline/candidate comparisons and optional modeled estimate from **illustrative** data. `npm test`: node:test unit/CLI/server tests. `node packages/cli/index.mjs install --target /existing/repo --ide claude`: copies skills into a user-specified existing project; refusing non-matching existing files.

When developing new adapters, keep them separately versioned and opt-in, preserve `docs/STATUS.md`, and add tests proving a real command with validated outputs. Report reproducible failures to maintainers with redacted reports and environment details.
