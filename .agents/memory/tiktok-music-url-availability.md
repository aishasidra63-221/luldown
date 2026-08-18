---
name: TikTok music URL availability
description: Behavior of TikTok Android aweme detail responses when music metadata has no playable URL.
---

TikTok's Android detail response may provide a complete `music` metadata object—ID, title, author, and duration—while `music.play_url.url_list` is empty and no music resolver URL is present. The corresponding `video` object can still contain playable video URLs and per-gear `audio_bit_rate` metadata. A competitor result can obtain a separate resolver whose `video_id` is an audio asset, whose `file_id` identifies that asset, and whose `item_id` is the music ID.

**Why:** A live normal-video response was observed with this exact split, while a competitor's MP3 result used a separate `aweme/v1/play` resolver with an audio-asset ID and music ID. Constructing an audio URL from `music.id` alone is not justified.

**How to apply:** Treat an empty music URL list as “no explicit audio URL supplied.” Find the separate audio-asset lookup/media route and verify the final MIME type before returning an MP3 URL; do not silently fabricate `.../{musicId}.mp3`. When the verified `tikcdn.io/ssstik/m/` attachment is available, redirect the browser to it rather than streaming its bytes through the app proxy.

Public probes of guessed `api.tiktokv.com/aweme/v1/music/detail`/`music/list` routes did not return a playable URL for the observed music ID, and public downloaders only parse `music.playUrl` when TikTok supplies it. The exact SSSTik server-side lookup remains hidden.