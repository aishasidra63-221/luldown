---
name: TikTok music URL availability
description: Behavior of TikTok Android aweme detail responses when music metadata has no playable URL.
---

TikTok's Android detail response may provide a complete `music` metadata object—ID, title, author, and duration—while `music.play_url.url_list` is empty and no music resolver URL is present. The corresponding `video` object can still contain playable video URLs and per-gear `audio_bit_rate` metadata.

**Why:** A live normal-video response was observed with this exact split, so constructing an audio URL from `music.id` or selecting a music resolver is not justified unless TikTok actually returns a playable audio URL.

**How to apply:** Treat an empty music URL list as “no explicit audio URL supplied.” Inspect the video/media response or another authorized TikTok media route and verify the final MIME type before returning an MP3 URL; do not silently fabricate `.../{musicId}.mp3`.