# IDE compatibility and limitations

| Host | Proposed local skill directory | Starter action | Actual model activation |
|---|---|---|---|
| Claude Code | `.claude/skills/` | Copy SKILL.md | Not tested |
| Cursor | `.cursor/skills/` | Copy SKILL.md | Not tested |
| Codex | `.agents/skills/` | Copy SKILL.md | Not tested |
| Gemini CLI | `.gemini/skills/` | Copy SKILL.md | Not tested |
| GitHub Copilot | `.github/skills/` | Copy SKILL.md | Not tested |
| Other IDEs | document adapter manually | Not implemented | Not tested |

Only run `install` on the user-specified project root. Never alter host-global config. Skill-directory presence is not evidence the model can call the CLI or that it may execute arbitrary commands. Validate host version and policy. Reference: https://learn.microsoft.com/en-us/training/support/agent-skills
