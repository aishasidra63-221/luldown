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

SSSTik's public JavaScript has a separate MP3 flow: Base64(JSON `{id, video}`) is POSTed to `r.ssstik.top/b/tiktok_mp3.sh`, which responds with `hx-redirect: https://r6.ssstik.top/ssstikm/{aweme_id}`. The latter directly serves an MP3 with ~30-day immutable cache headers.

**Why:** This explains how SSSTik can cache one audio result and serve many users without exposing or recomputing a music `file_id` in the browser.

**How to apply:** The key server-side behavior to reproduce/analyze is the Aweme-ID MP3 route, not necessarily a client-visible TikTok music resolver; treat it as a provider endpoint and avoid claiming its internal upstream algorithm is known.

The public MP3 backend accepts the same Aweme ID with either an SSSTik CDN video URL or the original TikTok URL and redirects to the same `/ssstikm/{aweme_id}` object; passing `music.mid` as `id` does not produce a redirect.

**Why:** This isolates the public cache key as the Aweme ID and shows `music.mid` is not the input to SSSTik's final cached MP3 route.

**How to apply:** Keep Aweme ID and music ID separate in any resolver/cache model; the hidden upstream step occurs before the Aweme-keyed MP3 object is served.