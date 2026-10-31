# Code-Codex black-hole provenance

The local Yien Studio black-hole rendering adaptation was derived from the user's installed `CodeCodex-background-black-hole-1.0.0.js`. At initial inspection the installed file was 32,085 bytes without a notice header. On reinspection on 2026-10-29, that same installed path contained a 49,186-byte file with a notice header and SHA-256 `ec3c32e194e546d2d124fa81d13dfa88b9b0e282dea7aa5929290a69ed842ca2`. The installed plugin was not modified by this task; an immutable hash of the earlier 32,085-byte version was not retained.

Upstream: https://github.com/Rice-dog/code-codex . Its root MIT license and third-party notices are retained beside this file. On 2026-10-29, the repository's public black-hole asset and notice were checked:

- https://github.com/Rice-dog/code-codex/blob/main/LICENSE
- https://github.com/Rice-dog/code-codex/blob/main/THIRD_PARTY_NOTICES_EN.md#black-hole-background
- https://raw.githubusercontent.com/Rice-dog/code-codex/main/releases/plugins/appearance/black-hole/CodeCodex-background-black-hole-1.0.0.js
- https://raw.githubusercontent.com/Rice-dog/code-codex/main/releases/release-assets.json

The upstream notice describes the visual reference as **Black Hole Hero Section**, creator **@yura**, platform **21st.dev**: https://21st.dev/community/components?preview=%2F%40yura%2Fcomponents%2Fblackhole-hero-section . It classifies that reference as "Reference only" and states that the Code-Codex implementation was independently created without intentionally including source or assets from the reference. This is the upstream authors' provenance statement, not an independent audit or an endorsement by the reference creator. The root MIT license applies only to independently authored Code-Codex material; the upstream notice does not relicense any third-party work.

The official main-branch manifest lists the same plugin filename with SHA-256 `723193dbb9ca89b09dc63978b6b2acdc32e85b5d722b69cf913125622daddf56` and 49,441 bytes. The current upstream asset and rechecked installed file both begin with the third-party notice, and their identifying code and black-hole defaults match in inspected excerpts. Their full hashes and lengths differ, so exact whole-file identity to the current upstream asset has not been established.

Yien Studio modifications: extracted and adapted the black-hole ray-march and postprocessing for its Three.js rendering lifecycle; composed it with the separately generated Yien Studio star field; adjusted resolution, placement and responsive behavior; added pointer-driven star and disk interaction; retained reduced-motion, visibility and performance fallbacks. This is an unofficial adaptation, not the reference creator's or Code-Codex's official distribution.
