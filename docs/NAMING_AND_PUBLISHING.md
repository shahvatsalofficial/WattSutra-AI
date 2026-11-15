# Name and publishing

- Product: **WattSutra AI**. CLI and npm package: `wattsutra` (unscoped; the name returned 404 on the npm registry before first publish on 2026-11-11).
- Repository: <https://github.com/shahvatsalofficial/WattSutra-AI>.
- Creator: **Vatsal Shah**. Attribution must be preserved (Apache-2.0 NOTICE).
- **Not done:** formal trademark search or clearance. Registry availability is not trademark clearance. No claim of exclusive rights to the name is made.
- Release path: tag `vX.Y.Z` triggers `.github/workflows/release.yml` (npm Trusted Publishing, provenance). Local fallback: `npm publish --access public --otp=<code>`.
- Pre-release gates: `npm test`, `npm run check:docs`, `npm run check:skills`, `npm run audit`, `npm pack --dry-run`.
