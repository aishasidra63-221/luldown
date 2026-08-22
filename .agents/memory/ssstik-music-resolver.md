---
name: SSSTik music resolver behavior
description: Public SSSTik MP3 flow and the boundary of what can be observed externally.
---

SSSTik returns a Base64-wrapped TikTok `/aweme/v1/play/` resolver for MP3 downloads; the wrapper serves the same MP3 bytes and does not expose its server-side upstream request.

**Why:** Repeated different videos showed exact `music_vid`/`mid` mapping but asset-specific music `file_id` values that were absent from TikTok detail JSON.

**How to apply:** Treat SSSTik as a public resolver-provider boundary: reverse-engineer client-visible protocol and compare App API identifiers, but do not assume the hidden server-side endpoint or claim the exact upstream call without evidence.

TikTok's signed Android `/aweme/v1/music/detail/` accepts `music_id` and returns rich `music_info`, but for tested original sounds its `play_url.uri` and `url_list` are empty and it contains no `file_id`, `signaturev3`, or `/aweme/v1/play/` URL.

**Why:** The endpoint is a real, successful music metadata lookup, but not the missing playback resolver for the inspected assets.

**How to apply:** Use `music.mid`/`id_str` (not the rounded numeric ID) for metadata lookup; continue searching for the playback-generation step separately.