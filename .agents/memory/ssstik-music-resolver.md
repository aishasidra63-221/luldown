---
name: SSSTik music resolver behavior
description: Public SSSTik MP3 flow and the boundary of what can be observed externally.
---

SSSTik returns a Base64-wrapped TikTok `/aweme/v1/play/` resolver for MP3 downloads; the wrapper serves the same MP3 bytes and does not expose its server-side upstream request.

**Why:** Repeated different videos showed exact `music_vid`/`mid` mapping but asset-specific music `file_id` values that were absent from TikTok detail JSON.

**How to apply:** Treat SSSTik as a public resolver-provider boundary: reverse-engineer client-visible protocol and compare App API identifiers, but do not assume the hidden server-side endpoint or claim the exact upstream call without evidence.