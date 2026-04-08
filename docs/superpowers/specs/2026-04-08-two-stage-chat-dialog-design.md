# Two-Stage Chat Dialog Design

## Summary

Replace the current always-fullscreen chat dialog with a two-stage pattern: an initial centered modal dialog (~65vw x 70vh) that expands to fullscreen on demand. This gives users a less jarring entry into the chat experience from the homepage while preserving the fullscreen workspace for report exploration.

## Current State

- `openChatFlow()` in `src/chat-flow.js` creates a `forge-dialog` with `fullscreen` attribute set immediately
- Header has a kebab menu button and a close button
- Split-view (chat + report) activates inside the fullscreen dialog

## Design

### Stage 1: Centered Modal

When a user submits a question from the homepage (`forge-ai-chatbot-launcher`), the `forge-dialog` opens **without** the `fullscreen` attribute.

- **Size:** CSS constrains the dialog to ~65vw wide x 70vh tall
- **Mode:** `modal`, `persistent`, `animation-type="fade"` (unchanged)
- **Header toolbar (left):** AI icon + "Report Assistant" title
- **Header toolbar (right):**
  1. **Minimize button** (`remove` icon) — closes the dialog, returns to homepage
  2. **Expand button** (`fullscreen` icon) — transitions to fullscreen
- **Body:** `forge-ai-chat-interface` with messages and prompt, identical to today
- Conversation starts immediately (reasoning steps, query card, etc.)

### Stage 2: Fullscreen

Three triggers cause `dialog.fullscreen = true`:

1. **Expand button** in the header toolbar
2. **"Explore Results" button** on query cards
3. **"Open Report" button** on standard report cards

Once fullscreen:
- The expand button icon swaps to `fullscreen_exit` and clicking it returns to centered modal (`dialog.fullscreen = false`)
- Split-view behavior (chat left, report right) only activates in fullscreen mode, same as today
- Chat content, scroll position, and conversation state are fully preserved through the transition — no rebuild

### What's Not Changing

- The conversation flow (reasoning, query cards, suggestions, etc.)
- The split-view / report designer integration
- The `forge-ai-chatbot-launcher` on the homepage
- The hub view's `forge-ai-floating-chat` — this change only affects the TIRA view dialog

### What's Removed

- The kebab/more-options button from the header toolbar (can be added back later)

## Files Affected

- `src/chat-flow.js` — dialog creation, header toolbar markup, fullscreen toggle logic
- `src/chat-flow.css` — centered modal sizing, expand/collapse button styles
