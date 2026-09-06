---
description: Draft a Reddit post for manual submission (checks subreddit rules first).
---

Draft a Reddit post for manual submission. User request: $ARGUMENTS

Steps:

1. Use the reddit MCP tools to research: `get_subreddit_info` for the target subreddit (check its rules, description, and stats). If a topic is given, `search_reddit` for similar existing posts — do not duplicate recent discussions.
2. Verify the draft complies with both subreddit rules and Reddit's Responsible Builder Policy (no identical cross-subreddit spam, no vote manipulation, promotional content must be clearly labeled and allowed by that subreddit).
3. Produce the final draft in this exact format, ready for the user to copy-paste into Reddit:

## Draft: r/<subreddit>

**Title:** <title>

**Type:** <post/link/flair if required>

**Body:**

<body text — written for this community, natural tone, no AI-sounding filler>

**Rules check:** <bullet list confirming each relevant subreddit rule is satisfied, or flagging conflicts>
