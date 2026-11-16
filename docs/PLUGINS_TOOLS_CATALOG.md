# Tools, plugins and MCP catalog — proposed integrations

WattSutra Core never requires a separate AI API key. All integrations are optional and subject to project-local installation and approval.

| Tool | Priority | Role | Caveat |
|---|---|---|---|
| Node.js 22+ | P0 included | cross-platform CLI | baseline only |
| OpenTelemetry | P1 | process/system/container metrics conventions | semantic convention versions evolve |
| k6 | P1 | HTTP load generation | authorized targets, resource limits |
| CodeCarbon | P1 | measured or modeled local CPU/GPU/RAM energy | sensor-dependent accuracy and limited accounting boundary |
| Scaphandre | P2 | host/process power exporter | sensor availability varies |
| CNCF Kepler | P2 | Kubernetes node/pod energy attribution | requires cluster permissions |
| Green Software Foundation SCI | P1 methodology | functional-unit carbon intensity | requires boundary, provenance and embodied methodology |
| Impact Framework | P2 | composable SCI modeling | modeling is not directly measured energy |
| Prometheus / Grafana | P2 | metric storage and visualization | read-only explicit credentials |
| PyRAPL / Intel RAPL / NVML | P2 | platform sensor options | hardware and OS permission constraints |
| Ollama / llama.cpp | P2 | private inference timing tests | local model download consent |
| OpenAI/Anthropic/Gemini billing exports | P3 | optional provider cost evidence | imports require explicit approval and pricing version |
| GitHub Actions | P0 config | OS matrix CI | CI config is not completed execution |
| Gitleaks / OSV-Scanner | P1 | supply-chain security | no secrets stored in repo |
| Docker / Testcontainers | P2 | isolated workload execution | not necessary for allowlisted offline demo |
| Context7 / Serena | Optional | docs and code navigation in Claude | only if installed/approved |
| MCP Inspector | P3 | test future MCP server | not a replacement for token and permission audits |
| Playwright | P3 | accessible dashboard tests | browser download optional |

Official starting points: https://opentelemetry.io/ ; https://grafana.com/oss/k6/ ; https://docs.codecarbon.io/ ; https://www.cncf.io/projects/kepler/ ; https://greensoftware.foundation/standards/sci/ ; https://if.greensoftware.foundation/ ; https://agentskills.io/ .

**Claude installation protocol:** inventory tools first; validate versions, license, maintainership and permissions; recommend project-local; request explicit approval before global installation, device driver changes, sudo, paid services, external network access or downloading large models. Never silently modify system-wide Claude or MCP settings.
