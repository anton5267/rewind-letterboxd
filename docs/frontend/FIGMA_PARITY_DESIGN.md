# REWIND full Figma parity — design proposal

**Status:** Approved by owner — implementation in progress
**Date:** 23 November 2026
**Figma source:** [REWIND implementation rules](https://www.figma.com/design/BDO9GO1oscOeUTcu4VXVKA/REWIND?node-id=5321-8872), file key `BDO9GO1oscOeUTcu4VXVKA`.

## Goal

Review the complete current REWIND design file, close the product UI gaps against its relevant screens and states, and make any missing UI designs consistent with the existing REWIND visual system. The result must work in the local React app and in the published GitHub Pages site.

## Current evidence

- A Page 1 metadata read on 24 November returned 574 direct children. The source-name counts reconcile with the 23 November layer inventory: 167 `[READY]`, 221 `DRAFT`, 4 `[ALTERNATE]`, 21 `[REFERENCE]`, 5 `[PROTOTYPE]`, 2 `[ARCHIVE]`, and 154 untagged. That read recorded 518 visible and 56 hidden; those aggregate metadata counts are historical, not a current live visual audit.
- Latest live Figma audit checkpoint on 26 November: matrix visibility classification is 486 confirmed visible, 9 confirmed hidden, and 79 not yet rechecked (574 total). Visibility is not implementation parity. Recent live frame checks include owner Watchlist `341:3632`, Followers `363:411`, Following `445:455` (20% frame opacity; source visually ambiguous), review edit `445:547`, review list `363:289`, and review detail `377:456` (no visible artwork in current canvas, conflicting with an older handoff; source ambiguous), owner Films `341:3348` public Films `122:176` (both 24-poster desktop grids; public assets appeared after load), owner Overview `238:865` and public Overview `238:596` (both loaded after assets appeared), admin report queues, detail frames, user list/detail and success states, public profile Lists, account settings Connections, Avatar & Banner, and Authentication, plus James Cameron `547:904`, Brad Pitt expanded/collapsed filmography `551:705` / `545:676`, and Oppenheimer `39:2`. Person and film artwork was captured after source assets loaded. The Figma moderation success states are not evidence for a new backend operation.
- Latest matrix recount on 27 November: 528 rows classified visible, 46 hidden, and 0 still unverified (574 baseline rows). `FIGMA_PARITY_MATRIX.csv` has 574 ordered baseline rows and now records 574 unique stable node IDs; no IDs remain unresolved or blank. The 27 November helper pass recovered IDs and visibility/type/dimensions for the final 16 rows, then classified all remaining 53 visibility-unknown rows. Those 53 are 27 reusable components and 26 reference/alternate assets, with no standalone product screens. Seven SF Pro Display rows map by sequence to seven of eight consecutive exact-name text layers before Rectangle 125; historical row-to-node identity cannot be proven from the current file, so the matrix explicitly marks the sequence-based mapping and extra eighth match. Current source-name classifications are 167 READY, 221 DRAFT, 4 ALTERNATE, 21 REFERENCE, 5 PROTOTYPE, 2 ARCHIVE, 153 UNTAGGED, and 1 HANDOFF. A read-only exact-ID comparison confirms 573 current direct children plus DRAFT ID `5623:6152` (baseline row 218, EN mobile social links) nested inside READY `1043:2233` (email editor). All 574 baseline IDs are unique and found; no IDs are missing or duplicated. These counts replace older checkpoints above, not the remaining frame-by-frame visual work. The Figma assistant's read-only inspection of mobile Public profile Films `845:1679` confirmed a populated 24-poster grid whose parent frame visibility is false; that row is explicitly classified as hidden source, not a blank design. Further read-only audits resolved visibility and component structure for nine sets/groups plus ten recovered IDs (rows 368/370/377/378/379 and 399/411/419/420/438/439/534/535/536/555). Some restored geometry/visibility is historical rather than current. Metadata availability proves inventory structure, not visual acceptance.
- The application is an existing UK/EN React/Vite app with localized routes, shared layout, reusable page components, and a current API contract. Existing implementation notes are in [FIGMA_HANDOFF](FIGMA_HANDOFF.md), [PROJECT_REQUIREMENTS](../project/PROJECT_REQUIREMENTS.md), [PROGRESS](../project/PROGRESS.md), and [PLAN](../../PLAN.md).
- The handoff already records targeted acceptance for some shared navigation, settings, lists, Journal, and Person flows, but it does not provide a frame-by-frame current parity matrix. Those earlier results are evidence for their exact scope, not proof that the full Figma file matches.

## Source hierarchy

1. Visible `[READY]` frames are the primary visual source for the corresponding product route and state.
2. Visible `DRAFT` frames are inspected as candidate designs for states or responsive variants. Record whether each candidate is implemented, superseded, ambiguous, or not applicable; do not silently promote a draft to approved source.
3. Shared components, references, and source fragments supply reusable assets and context. Hidden alternatives, prototypes marked as excluded, archival frames, and exploratory references are catalogued but are not treated as product requirements unless the current handoff explicitly identifies them as a source.
4. Where no applicable screen or state exists, create a documented implementation design using the nearest approved REWIND layout, typography, color, spacing, and interaction patterns. Keep it UI-only unless an existing API contract supports the action. Do not invent data, endpoints, Admin fields, or product behavior.

## Product reference: TMDB

The owner identified [The Movie Database](https://www.themoviedb.org/) as a product reference as well as REWIND's existing film-metadata source. During the Figma audit, review relevant TMDB movie, person, catalog, and discovery screens for useful information hierarchy and interactions, then look for ways REWIND can serve its own film-diary, reviews, lists, and community use cases better. Keep REWIND's visual identity and Figma source hierarchy; TMDB is inspiration, not a replacement design authority. Use only film data and actions supported by the current API, and document any implementation-created UI and its constraints in the handoff.

TMDB automation currently refreshes metadata for catalog films that already have a confirmed TMDB ID. It does not indiscriminately import the entire TMDB catalog. Any broader automatic discovery/import must use a bounded selection and existing API limits; never guess ID mappings or claim that every TMDB title is included.

## Proposed implementation

### 1. Build the complete audit matrix

Maintain the 574-row baseline inventory and reconcile it with the 573 direct children reported by live Figma. For each row, record stable ID, name, visibility/status, screen family, locale, viewport, route/state, relevant component, and disposition. The inventory now has a unique ID and a visibility classification for every baseline row; the difference is reconciled: baseline row 218 (`5623:6152`) is nested inside frame `1043:2233`, while the other 573 IDs are direct children. Product-relevant screens still require rendered evidence and route/state dispositions. Product screens must map to an implemented route and have one of these results: `matches`, `gap to implement`, `intentional responsive adaptation`, `ambiguous source`, or `not applicable`. Cite the evidence for each completed result.

### 2. Close the visual and state gaps

Work in route-sized batches using the current React/Vite components and CSS modules. Preserve UK/EN copy, current URL/API contracts, access boundaries, accessibility labels, focus behavior, loading/error/empty/retry states, and reduced-motion behavior. Use existing assets when the source identifies them. For missing designs, document the implementation decision in the handoff and label it as an implementation-created design.

Treat motion as part of interaction quality: use short, purposeful transitions for navigation, feedback, and content reveal; prefer opacity and transforms over animating layout; avoid motion that delays reading or action; and honor `prefers-reduced-motion`. Do not add animation merely to decorate a screen. The user also asked that any future Figma-created proposal stay separate and clearly named; keep the designer-owned source frames and page structure untouched under this audit's current scope.

### 3. Verify local rendering

Compare local rendered screens with the mapped Figma frame at its source size and representative responsive widths: 320, 393, 768, 1024, and 1440px. Verify both UK and EN wherever both exist. Capture the exact route, state, viewport, and screenshot for every audited screen family, including relevant drafts and error/empty/loading states. Resolve visible clipping, overflow, wrong assets, alignment, typography, and interaction-target differences before acceptance.

### 4. Publish and verify the site

Run the repository CI and Pages workflow for the reviewed source, preserve the existing GitHub Pages + Supabase architecture, and verify the deployed bundle after publication against the same route/state/viewport matrix. Do not change Supabase schema, production data, or secrets as part of visual parity work.

## Out of scope

- Replacing GitHub Pages or changing Supabase hosting/data architecture.
- Adding endpoints, sample product data, or unsupported Admin behavior to make a mockup appear complete.
- Editing or relabeling designer-authored Figma frames. Missing designs are documented as implementation decisions in the repository handoff.
- Claiming overall parity based only on a successful build, one screenshot, or existing targeted tests.

## Acceptance criteria

- All 574 baseline rows have an inventory record and source classification; the 573-direct-child / 574-baseline difference is reconciled as one nested frame; all product-relevant visible `[READY]` and `DRAFT` frames are mapped to a route/state or have an evidence-backed disposition.
- Every in-scope `[READY]` frame is either visually accepted, has its documented intentional adaptation accepted, or has its identified gap implemented and rechecked.
- Every in-scope `DRAFT` screen/state is reviewed and marked as implemented, superseded, ambiguous, or not applicable, with the reason recorded.
- Missing UI designs are documented with their source pattern and constraints; implementation does not introduce unsupported behavior or data.
- Local UK/EN rendering has no unreviewed visual or interaction gaps across the source viewports and representative responsive widths.
- The reviewed changes pass the repository's relevant CI checks, are published to GitHub Pages, and receive post-deploy acceptance using the same route/state matrix.

## Known hosting constraint

GitHub Pages currently serves the site without CSP, X-Frame-Options, `X-Content-Type-Options`, or Referrer-Policy response headers. This proposal does not claim to close that hosting-level security-header gate or change the hosting architecture; its current evidence is in [release evidence](../operations/RELEASE_EVIDENCE.md#github-pages-response-header-check--23-november-2026).
