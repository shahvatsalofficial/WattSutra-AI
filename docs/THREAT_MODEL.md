# Threat model and mitigations

**Assets:** billing data, host inventory, model usage, prompts, production instrumentation credentials, pricing, source code and confidential performance results.

**Threats:** malicious benchmark manifests running unknown commands; model prompt injection from source documents; code execution through a poorly sandboxed profiling runner; PII leakage from telemetry; session-token theft; privilege escalation from meter permission changes; SSRF in observability connectors; resource exhaustion; doctored measurements; contaminated comparisons; fabricated emission savings.

**Starter mitigations:** only two allowlisted internal workload algorithms and n/samples limits, no arbitrary spawn from user data, standard-library-only core, no-key operation, explicit file paths, symlink rejection on report reads and skill install, no public listeners, authenticated read-only localhost API, integrity hashes, provenance and measured/modeled separation.

**Remaining limits:** no container sandbox because no arbitrary code runner is exposed; symlink race defenses and high-assurance filesystem confinement need further engineering if used with untrusted multiuser workloads; server auth is single token and is not safe for deployment on a public host; CPU/RSS metering is not isolated; no encryption at rest; external API credentials must be managed outside this starter. Run in a dedicated low-privilege account and never benchmark production workloads automatically.
