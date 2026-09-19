# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, v16) + TypeScript + Supabase (Postgres, Auth, Storage). Not delegated — chosen by the user at project start, before this build.

## Users

Friend groups who play board games together and want to remember and compare their sessions. The primary user registers an account, creates or joins a private "hive" (group), and logs plays after game nights. The first real-world hive is the founder's own friend group; the product is built to let any group of friends spin up their own, not hardcoded to one circle. Everyone in a hive already knows each other — this is not a discovery or matchmaking product between strangers.

## Product Purpose

Boardhive tracks board game play sessions within closed, private friend groups: who played what, when, who won, and what it was like (a photo, a comment). Success is a group that actually keeps logging plays after the novelty wears off, because the logging itself is fast (game data autofills from a 140k-game BoardGameGeek catalog already imported) and the payoff (stats, shared memory) is visible immediately.

## Positioning

No existing board-game tracker combines a closed multi-tenant group model with a photo + personal comment as the core unit of a logged play (researched and ruled out: NemeStats, BGStats, Meeplay, Board Games Tracker, BoardGameHQ — each does either the stats side or the social/discovery side, not both with this focus). Boardhive is not a public game-discovery or social platform; there is no cross-group visibility, no strangers, no marketplace.

## Operating Context

- A play is logged after a game session, most likely on a phone, possibly one-handed, possibly mid-conversation — this is the single highest-frequency interaction and the reason the product is mobile-first.
- Game data (name, image, player count, categories, mechanics) is autofilled from an already-imported BoardGameGeek catalog (140,700 games) — never typed by hand.
- Scoring shape varies by game: asymmetric games track faction/role per player, racing games track podiums, everything else falls back to a generic score/placement/winner model.
- Groups also maintain a personal + shared "library" of games members physically own, surfaced first when logging a play (quick-pick before falling back to full catalog search) — this is a practical "what can we play tonight" tool, not a collection-flex feature.
- Not every player at the table has a Boardhive account — guests without an account can still be logged as participants.

## Capabilities and Constraints

- Multi-tenant by group ("hive"): a user can belong to multiple hives; stats, plays, and library visibility are always scoped to a hive's current members and never mixed across hives.
- Invites are a reusable code/link per hive, not targeted per-email invitations.
- A non-member hitting a hive's URL sees the same 404 as a nonexistent hive — no group-existence leakage.
- Comments are one editable slot per participant per play, not a free-form thread.
- Backend (Postgres schema, RLS policies, Storage buckets) is already fully implemented on Supabase — this build is the frontend against an existing, stable contract.
- Explicitly out of scope: public game discovery, matchmaking with strangers, event organizing, buy/sell marketplace, lending/condition tracking on library items.

## Brand Commitments

- Name: **Boardhive** — "board" (universal across board games) + "hive" (the multi-group/community structure). Chosen after an extensive naming pass (Mesava, Ludoro, Meepled, Tabled, Boarded, Boardive, Peña, Rondas, and others were rejected).
- Domain: boardhive.es (secured).
- No existing logo, color palette, or visual identity — fully open for this build.

## Evidence on Hand

- Full BoardGameGeek catalog already imported into `games`/`categories`/`mechanics` tables (140,700 games, real names/images/descriptions/player counts) — real data, not placeholder, available for every game-related surface from the start.
- No user-generated content yet (no real plays, photos, or comments exist) — early empty-state design matters more than steady-state here.
- No existing brand assets.

## Product Principles

1. Logging a play must be fast enough to survive being done mid-game-night on a phone — every extra tap in that flow is a tax on the core loop.
2. A hive's data is that hive's alone — no leakage, no cross-group visibility, ever, including through error states and URLs.
3. Autofill over data entry wherever the catalog can answer the question; never make someone type what the system already knows.
4. The product should feel like it belongs to the friend group using it, not like a generic SaaS dashboard — this is a private, personal tool, not a platform.

## Accessibility & Inclusion

Standard web accessibility practice (WCAG AA contrast, full keyboard and touch operability, respect for `prefers-reduced-motion`) — no specific individual need identified beyond that.
