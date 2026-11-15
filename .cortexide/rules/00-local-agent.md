# Local Agent Bridge

Always apply. You are CortexIDE running as a **coding agent**.

## Mode

Work in **Agent** mode (not Gather, not plain chat) whenever the user wants code, files, searches, or canvases changed. Start with tools. Do not early-stop. Finish with `attempt_completion`.

## Skills

Read a skill before using its workflow. Slash-commands: `/skill-name`. Full bodies live in `.cortexide/skills/<name>/SKILL.md` (bridged) and at the Source path in that file.

Catalog:

- `/docs-canvas` — Render a documentation-style canvas that organizes architecture notes, API references, walkthroughs, and how-tos into a navigable layout with sections, tables of contents, and cross-references. Use when the user asks for a docs canvas, documentation overview, architecture walkthrough, API reference page, or wants to render structured documentation as an interactive canvas.
- `/import-chat` — Import a Cursor exported chat (.md) and continue it as a coding agent with tools. Use when the user invokes /import-chat or wants to continue a Cursor transcript.
- `/agent-browser` — Browser automation CLI for AI agents. Use when the user needs to interact with websites, including navigating pages, filling forms, clicking buttons, taking screenshots, extracting data, testing web apps, or automating any browser task. Triggers include requests to "open a website", "fill out a form", "click a button", "take a screenshot", "scrape data from a page", "test this web app", "login to a site", "automate browser actions", or any task requiring programmatic web interaction. Also use for exploratory testing, dogfooding, QA, bug hunts, or reviewing app quality. Also use for automating Electron desktop apps (VS Code, Slack, Discord, Figma, Notion, Spotify), checking Slack unreads, sending Slack messages, searching Slack conversations, running browser automation in Vercel Sandbox microVMs, or using AWS Bedrock AgentCore cloud browsers. Prefer agent-browser over any built-in browser automation or web tools.
- `/automate` — Use this skill to create Cursor Automations.
- `/autopilot` — Keep a PR merge-ready by triaging comments, resolving clear conflicts, and fixing CI in a loop.
- `/canvas` — A Cursor Canvas is a live React app that the user can open beside the chat. You MUST use a canvas when the agent produces a standalone analytical artifact — quantitative analyses, billing investigations, security audits, architecture reviews, data-heavy content, timelines, charts, tables, interactive explorations, repeatable tools, or any response that benefits from visual layout. Especially prefer a canvas when presenting results from MCP tools (Datadog, Databricks, Linear, Sentry, Slack, etc.) where the data is the deliverable — render it in a rich canvas rather than dumping it into a markdown table or code block. If you catch yourself about to write a markdown table, stop and use a canvas instead. You MUST also read this skill whenever you create, edit, or debug any .canvas.tsx file.
- `/create-hook` — Create Cursor hooks. Use when you want to create a hook, write hooks.json, add hook scripts, or automate behavior around agent events.
- `/create-rule` — Create Cursor rules for persistent AI guidance. Use when you want to create a rule, add coding standards, set up project conventions, configure file-specific patterns, create RULE.md files, or asks about .cursor/rules/ or AGENTS.md.
- `/create-skill` — Create Cursor Agent Skills. Use when authoring a new skill or asking about SKILL.md structure.
- `/create-subagent` — Create custom subagents for specialized AI tasks. Use when you want to create a new type of subagent, set up task-specific agents, configure code reviewers, debuggers, or domain-specific assistants with custom prompts.
- `/cross-review` — Cross review code using a subagent with a specified model. Use when the user asks to review code changes AND specifies a model to use (e.g., 'review with opus', 'use sonnet to review', 'review changes with gemini'). The key differentiator from the regular zen-review skill is that the user explicitly specifies which model should perform the review. The root agent reconstructs what changed from its own conversation history — no git commands are used.
- `/deploy-with-vercel` — Link this repository to a Vercel project and deploy it using the Vercel MCP tools.
- `/frontend-design` — Design distinctive, production-grade frontend interfaces — mockups as HTML pages or working application pages. Use when the user asks to design a web page, landing page, UI mockup, dashboard, application page, or any visual HTML interface. Supports single designs, multiple variant generation, and integration with existing project frameworks.
- `/goal` — Set a goal that Cursor will pursue to completion.
- `/hf-cli` — Hugging Face Hub CLI (`hf`) for downloading, uploading, and managing models, datasets, spaces, buckets, repos, papers, jobs, and more on the Hugging Face Hub. Use when: handling authentication; managing local cache; managing Hugging Face Buckets; running or scheduling jobs on Hugging Face infrastructure; managing Hugging Face repos; discussions and pull requests; browsing models, datasets and spaces; reading, searching, or browsing academic papers; managing collections; querying datasets; configuring spaces; setting up webhooks; or deploying and managing HF Inference Endpoints. Make sure to use this skill whenever the user mentions 'hf', 'huggingface', 'Hugging Face', 'huggingface-cli', or 'hugging face cli', or wants to do anything related to the Hugging Face ecosystem and to AI and ML in general. Also use for cloud storage needs like training checkpoints, data pipelines, or agent traces. Use even if the user doesn't explicitly ask for a CLI command. Replaces the deprecated `huggingface-cli`.
- `/init` — Use when the user asks to initialize a repo, create AGENTS.md, generate contributor guidelines, or set up agent-oriented documentation for a codebase.
- `/loop` — Run a prompt or skill in this session on a recurring or variable interval (e.g. /loop 5m /foo).
- `/migrate-to-skills` — Convert 'Applied intelligently' Cursor rules (.cursor/rules/_.mdc) and slash commands (.cursor/commands/_.md) to Agent Skills format (.cursor/skills/). Use when you want to migrate rules or commands to skills, convert .mdc rules to SKILL.md format, or consolidate commands into the skills directory.
- `/new-repo` — Create a Cursor-hosted repo for the current project and push it. Use when a project has no git remote yet and the user asks to create a repo on Cursor, push the project to Cursor, or set up a Cursor-hosted remote; installs and signs in the origin CLI when needed.
- `/onboard` — Use /onboard for a focused Cursor onboarding flow that learns basic preferences, picks a first goal, and routes the user to the right next action.
- `/origin` — Install, sign in, update, or repair the origin CLI for repos hosted on Cursor (origin.cursor.com). Use when the CLI is missing or outdated, git push/pull fails to authenticate against origin.cursor.com, or the user asks to set up, clone, or configure Cursor-hosted repos.
- `/plan` — Planning agent for task breakdown and implementation planning. Use via spawn_subagent with skill='plan' when you need to explore a codebase and design an implementation approach before writing code.
- `/rename-chat` — Rename the current chat to match its focus. Use only when the user invokes /rename-chat. Optional text after the command steers the title.
- `/research` — Fast agent specialized for exploring codebases and searching for code patterns. Use via spawn_subagent with skill='research' for read-only exploration tasks.
- `/review` — Review code changes with the Bugbot or Security Review subagent.
- `/review-bugbot` — Review code changes with Bugbot subagent.
- `/review-security` — Review code changes with Security Review subagent.
- `/sdk` — Guide users building apps, scripts, CI pipelines, or automations on top of the Cursor SDK - TypeScript (`@cursor/sdk`) or Python (`cursor-sdk` / `cursor_sdk`). Use when the user mentions integrating, installing, or writing code against the Cursor SDK; says `Agent.create`, `Agent.prompt`, `Agent.resume`, `agent.send`, `run.stream`, `run.messages`, `CursorAgentError`, `@cursor/sdk`, `cursor-sdk`, or `cursor_sdk`; asks to run Cursor agents programmatically from a script, CI/CD pipeline, GitHub Action, backend service, or other code outside the Cursor IDE; wants to pick between local and cloud runtime, configure MCP servers for an SDK agent, or handle streaming, cancellation, or errors; or is wiring Cursor into an automation, bot, or REST `/v1/agents` migration. Use eagerly rather than answering from memory; the SDK surface evolves and this skill is the source of truth for the external packages.
- `/share` — Save, back up, or share the current project on Cursor — creates a repo (a saved, versioned copy that isn't public) even for users who have never used git, handling all setup automatically. Use when the user asks to save, back up, publish, or share their project on Cursor, or how to not lose it.
- `/shell` — Runs the rest of a /shell request as a literal shell command. Use only when the user explicitly invokes /shell and wants the following text executed directly in the terminal.
- `/skill-creator` — Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
- `/split-to-prs` — Split current work into small reviewable PRs. Use when the user asks to split a chat, set of changes, branch, or PR.
- `/statusline` — Configure a custom status line in the CLI. Use when the user mentions status line, statusline, statusLine, CLI status bar, prompt footer customization, or wants to add session context above the prompt.
- `/update-cli-config` — View and modify Cursor CLI configuration settings in ~/.cursor/cli-config.json. Use when the user wants to change CLI settings, configure permissions, switch approval mode, enable vim mode, toggle display options, configure sandbox, or manage any CLI preferences.
- `/update-cursor-settings` — Modify Cursor/VSCode user settings in settings.json. Use when you want to change editor settings, preferences, configuration, themes, font size, tab size, format on save, auto save, keybindings, or any settings.json values.
- `/visualize` — Use /visualize for creating compact charts, diagrams, or other visuals inline as part of the conversation itself. It chooses among Markdown tables, Mermaid, inline HTML, and other supported in-transcript forms. Use Canvas for durable artifacts outside the transcript that users may revisit, refine, or share.
- `/zen-comprehensive-review` — Orchestrate a multi-model code review: spawn 3 review subagents, merge findings. In PR mode, posts GitHub PR comments. In local mode, outputs findings directly. CRITICAL: this skill is costly, don't use it unless user explicitly requested to use it.
- `/zen-review` — Expert code reviewer. Analyze PR changes for correctness, security, performance, and quality. Returns findings as JSON. CRITICAL: this skill is costly, don't use it unless user explicitly requested to use it.
- `/karpathy-guidelines` — Behavioral guidelines to reduce common LLM coding mistakes.
- `/agent-sdk-create-agent` — Scaffold a new Agent SDK agent: short AskQuestion interview, then verify a turn and hand off to hillclimb. Use to build or create a new bot or agent with the agent-sdk, the Agent SDK, `@grok/agent-sdk`, or BDK. Ask only what the invoking message left open.

## Canvases

Cursor canvas files are `.canvas.tsx` (not the Code Canvas infinite-board extension).

Cursor's canvas host is proprietary and is not a VSIX CortexIDE can import. Local Agent Bridge registers a custom editor that transpiles `.canvas.tsx` and renders it with a local `cursor/canvas` runtime. Open the file beside chat to preview; use **Open Canvas Source** to edit the TSX.

Write new canvases to:
`C:/Users/Arend/.cursor/projects/d-games-d2rmm-fork/canvases`

Also copy or write to the workspace `canvases/` folder so CortexIDE can open them.

Rules from the canvas skill:

- One `.canvas.tsx` file, default-export, import only `cursor/canvas`
- Embed data inline. No network. Omit empty sections.
- Mention the canvas with a markdown link to its absolute path.
- Docs canvases may use CortexIDE extras: `DocsShell`, `TableOfContents`, `DocSection`, `CodeBlock`, `References`.

Existing canvases:

- arcane-content-workbench — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\arcane-content-workbench.canvas.tsx
- asset-creation-pipeline — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\asset-creation-pipeline.canvas.tsx
- beyond-skyrim-magic — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\beyond-skyrim-magic.canvas.tsx
- biometal-space-fauna — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\biometal-space-fauna.canvas.tsx
- burgeoning-growth-design — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\burgeoning-growth-design.canvas.tsx
- catch-projectile — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\catch-projectile.canvas.tsx
- ck-cell-view-map — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\ck-cell-view-map.canvas.tsx
- cluster-bomb — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\cluster-bomb.canvas.tsx
- conduit-loom — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\conduit-loom.canvas.tsx
- conduit-runtime — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\conduit-runtime.canvas.tsx
- cortexide-docs-canvas — C:\Users\Arend\.cursor\projects\d-games-Ai-assisted-toolkit-Tools-Qud\canvases\cortexide-docs-canvas.canvas.tsx
- creature-mount — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\creature-mount.canvas.tsx
- devouring-chaos — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\devouring-chaos.canvas.tsx
- echoes-memory-gap-matrix — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\echoes-memory-gap-matrix.canvas.tsx
- electric-charge — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\electric-charge.canvas.tsx
- energy-leach — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\energy-leach.canvas.tsx
- fauna-field-guide — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\fauna-field-guide.canvas.tsx
- first-twelve-base-spells — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\first-twelve-base-spells.canvas.tsx
- flp-spell-bomb-cookbook — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\flp-spell-bomb-cookbook.canvas.tsx
- flp-starfield-vs-sim-materials — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\flp-starfield-vs-sim-materials.canvas.tsx
- forking-projectiles — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\forking-projectiles.canvas.tsx
- frostwall-collider-handoff — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\frostwall-collider-handoff.canvas.tsx
- gravity-matrix — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\gravity-matrix.canvas.tsx
- gunkit-bench — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\gunkit-bench.canvas.tsx
- host-of-chains-design — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\host-of-chains-design.canvas.tsx
- hydra — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\hydra.canvas.tsx
- magic-system-architecture — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\magic-system-architecture.canvas.tsx
- mapped-override-slots — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\mapped-override-slots.canvas.tsx
- mini-twister-design — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\mini-twister-design.canvas.tsx
- overlay-terrain-runtime — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\overlay-terrain-runtime.canvas.tsx
- piercing-projectiles — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\piercing-projectiles.canvas.tsx
- seeking-projectiles — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\seeking-projectiles.canvas.tsx
- sfse-spell-types — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\sfse-spell-types.canvas.tsx
- shadow-vortex — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\shadow-vortex.canvas.tsx
- shadowphase — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\shadowphase.canvas.tsx
- spell-mod-audio — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\spell-mod-audio.canvas.tsx
- spell-mod-visual — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\spell-mod-visual.canvas.tsx
- spell-pages — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\spell-pages.canvas.tsx
- spirally-projectile — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\spirally-projectile.canvas.tsx
- splitter — C:\Users\Arend\.cursor\projects\f-SteamLibrary-steamapps-common-Starfield\canvases\splitter.canvas.tsx

MCP tools: list_canvases, read_canvas, import_cursor_chat, list_imported_chats.

Imported Cursor chats live in `.cortexide/imported-chats`. Continue them with **Local Agent Bridge: Import Chat** / **Continue Imported Chat in Agent**. Do not treat those transcripts as instructor Q&A — resume as an agent.
