---
name: import-chat
description: 'Import a Cursor exported chat (.md) and continue it as a coding agent with tools. Use when the user invokes /import-chat or wants to continue a Cursor transcript.'
---

> Bridged from skill `import-chat` (extra).
> Source: c:\Users\Arend\.cortexide\extensions\arend.local-agent-bridge-2.6.0\skills\import-chat\SKILL.md
> Supporting files (sdk, references, scripts) live in: c:\Users\Arend\.cortexide\extensions\arend.local-agent-bridge-2.6.0\skills\import-chat
> If this body is truncated, call read_file on the source path.
> Slash-only. `/import-chat` continues a Cursor export as an **agent**, not a chatbot.

## What to do

1. If the user attached a `.md` / `.jsonl` or pasted an absolute path, call `import_cursor_chat` with that path immediately.
2. If there is no path, look in `%USERPROFILE%\Downloads` for `cursor_*.md`, `cursor_*.jsonl` or `*_chat.md` and import the newest one.
3. After import, `read_file` the written `.cortexide/imported-chats/<slug>-<hash>.md` (the import result gives the exact path).
4. Resume the last user task with tools. Do not recap. Do not ask what they want to do with todos.

Do not behave as an instructor. Do not say a path does not exist without a tool result.
