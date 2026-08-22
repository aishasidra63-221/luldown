---
name: TikTok music URL availability
description: Behavior of TikTok Android aweme detail responses when music metadata has no playable URL.
---

TikTok's Android detail response may provide a complete `music` metadata object—ID, title, author, and duration—while `music.play_url.url_list` is empty and no music resolver URL is present. The corresponding `video` object can still contain playable video URLs and per-gear `audio_bit_rate` metadata. `extra.original_song_url` may contain a numeric MP3 filename that identifies a CDN audio object, but this is distinct from a separate resolver's 32-character `file_id`.

**Why:** Live normal-video responses show this exact split. A direct TikTok MP3 URL can expose a numeric object ID, while a competitor's MP3 result uses a separate `aweme/v1/play` resolver with an audio-asset ID and music ID. Constructing an audio resolver from `music.id` alone is not justified.

**How to apply:** Treat an empty music URL list as “no explicit audio URL supplied.” Record the numeric basename from `original_song_url` as evidence only; find the separate audio-asset lookup/media route and verify the final MIME type before returning an MP3 URL. Do not silently fabricate `.../{musicId}.mp3` or treat the numeric basename as a resolver `file_id`.