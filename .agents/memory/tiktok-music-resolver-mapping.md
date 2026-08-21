---
name: TikTok music resolver mapping
description: Non-obvious relationship between TikTok App API music metadata and the SSSTik-generated play resolver.
---

The SSSTik MP3 wrapper can contain a Base64-encoded TikTok `/aweme/v1/play/` resolver. Its `video_id` maps to TikTok `music.extra.music_vid`, and its `item_id` maps to `music.mid`. The resolver also requires a resolver-specific `file_id` and signed `signaturev3`; the numeric filename in `music.extra.original_song_url` is a direct CDN object ID, not necessarily the resolver `file_id`.

**Why:** A TikTok Android detail response may leave `music.play_url.url_list` empty while exposing `original_song_url` and the identifiers SSSTik uses to obtain an audio resolver.

**How to apply:** Parse `music.extra` before declaring audio unavailable. Prefer a decoded TikTok signaturev3 resolver when available, keep `original_song_url` as fallback, and never infer the resolver `file_id` from the direct CDN filename without verification.