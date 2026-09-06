---
name: reddit
description: Read, search, post, comment, edit, and delete on Reddit via the reddit MCP server. Use when the user mentions Reddit, subreddits, posting to Reddit, replying, or researching Reddit communities (e.g. for beta launches or marketing).
---

# Reddit

The `reddit` MCP server is configured in `opencode.json`. Tools are available directly (e.g. `browse_subreddit`, `search_reddit`, `get_post_comments`, `create_post`, `reply_to_post`, `edit_content`, `delete_content`, `get_user_info`).

## Auth (current: anonymous read-only)

The MCP server currently runs in ANONYMOUS mode — the user's Reddit account is too new to create a script app, so there are no OAuth credentials.

- READ tools work (subject to ~10 req/min; Reddit may 403-block anonymous requests from some networks — if all tools fail with 403, tell the user and suggest retrying later or reading via webfetch of `https://www.reddit.com/r/<sub>/hot/.json`).
- WRITE tools (create_post, reply_to_post, edit_content, delete_content) WILL FAIL. Do not call them, do not try to work around it.
- When the user asks to post, comment, reply, or edit: DRAFT the content instead — title, body, target subreddit, and per-subreddit compliance notes — and give it to the user to post manually. Never attempt to post via browser automation or any workaround; that violates Reddit's policy and risks account suspension.

## Upgrade path

Once the user's account is established (verified email, some age/karma), they can create a script app at https://www.reddit.com/prefs/apps and register at https://developers.reddit.com/app-registration. Then switch `REDDIT_AUTH_MODE` in opencode.json back to `authenticated` with `{env:...}` credentials and enable write operations.

## Rules when posting or interacting

Compliance with Reddit's Responsible Builder Policy (https://support.reddithelp.com/hc/en-us/articles/42728983564564-Responsible-Builder-Policy) is mandatory:

- Always read a subreddit's rules (`get_subreddit_info`) before drafting a post for it.
- NEVER draft identical or substantially similar content for multiple subreddits — Reddit's policy explicitly prohibits this as spam. Each draft must be uniquely written for its community.
- No vote/karma manipulation, no circumventing bans or blocks, and never draft DM campaigns without the user's explicit consent.
- Do not derive or infer sensitive characteristics about Reddit users (health, politics, orientation), and never attempt to de-anonymize them.
- Drafts must comply with Reddit Rules; policy violations can get the account suspended.
- If a read tool returns a rate-limit or 403 error, stop and report; do not retry aggressively.
