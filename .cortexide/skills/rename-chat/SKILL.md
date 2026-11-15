---
name: rename-chat
description: 'Rename the current chat to match its focus. Use only when the user invokes /rename-chat. Optional text after the command steers the title.'
---

> Bridged from skill `rename-chat` (agents).
> Source: C:\Users\Arend\.agents\skills\skill-creator\rename-chat\SKILL.md
> Supporting files (sdk, references, scripts) live in: C:\Users\Arend\.agents\skills\skill-creator\rename-chat
> If this body is truncated, call read_file on the source path.

# Rename Chat

Slash-only. Text after `/rename-chat` is an optional naming hint, not a verbatim title.

Pick a 3-5 word topic title in sentence case: first letter uppercase, rest lowercase except acronyms and proper nouns. Hint steers wording only. Example: hint `billing retries` → `Billing retries`. Avoid "Chat", "Conversation", or "Rename chat". At most 200 characters.

Call `cursor-app-control.rename_chat` once with that title. Do not ask for confirmation. If the tool is missing or fails, say so plainly and do not claim the chat was renamed.
