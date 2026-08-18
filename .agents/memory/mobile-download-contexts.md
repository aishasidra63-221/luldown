---
name: Mobile download contexts
description: Browser behavior differences between main-tab attachment navigation and independent download-manager requests.
---

For mobile slideshow images, use an independent browser download context (such as a user-initiated hidden anchor with `download` plus an attachment response) rather than navigating the current tab. A long streamed attachment can occupy the tab's navigation/download state and prevent the next Save click, while fast URL-resolve redirects may still appear to work. Browser behavior varies by device, so the same technique can behave differently across sites and phones.

**Why:** Testing two downloader sites on two phones showed opposite one-download/multiple-download behavior; the differentiator was the frontend download trigger and response handling, not simply the phone or CDN.

**How to apply:** Keep video resolve/redirect flows separate when they are intentionally browser-playable. For multiple image saves, let each click create its own download-manager job and ensure the proxy response supplies `Content-Disposition: attachment`.