# App Store campaign links

- App: "Sleep & White Noise: Pulvio", Apple ID `6813647835`, bundle `com.pulvio.app`, provider token `pt=129476369`
- Plain link (no tracking): https://apps.apple.com/us/app/sleep-white-noise-pulvio/id6813647835

## Tracked links (generated in App Store Connect)

| Platform | Where | Link |
|---|---|---|
| TikTok | profile bio | https://apps.apple.com/app/apple-store/id6813647835?pt=129476369&ct=tiktok&mt=8 |
| Instagram | profile bio | https://apps.apple.com/app/apple-store/id6813647835?pt=129476369&ct=instagram&mt=8 |
| YouTube | channel Links section | https://apps.apple.com/app/apple-store/id6813647835?pt=129476369&ct=youtube&mt=8 |

A new campaign needs no setup: change `ct=` to any name (max 40 chars) and it shows up in Analytics after the first visits, e.g. `ct=tiktok_pinned_comment` to tell bio clicks from comment-link clicks.

## Reading results

App Store Connect → Analytics → Sources → Campaigns: each `ct` shows impressions, product page views and first-time downloads. Data lags by a day or two. Copy the numbers into the `installs_est` column of `posts.csv` (per platform, weekly).
