# REWIND motion system

## Goal

Give the movie, search, and public-list discovery surfaces a consistent, restrained response to pointer and keyboard interaction while preserving existing Figma layout geometry and honoring reduced-motion preferences.

## Scope

- Add shared CSS motion tokens for short and standard interaction timing and a shared easing curve.
- Add a reusable surface class to Home movie cards, Global Search film/list/article cards, and Public Lists cards.
- On hover-capable devices, lift a card by at most 3px and add a restrained shadow. `:focus-within` receives the same affordance for keyboard users.
- Keep transitions limited to transform, shadow, and existing border/background properties. Never animate dimensions or layout properties.
- Under `prefers-reduced-motion: reduce`, disable the lift, shadow transition, and motion on the shared surface class. Keep existing global reduced-motion behavior.
- Add Playwright coverage for pointer, keyboard, reduced-motion, and narrow-viewport overflow.

## Non-goals

- No animation dependency, JavaScript animation framework, autoplay, scroll-triggered reveals, page transitions, or new data/API behavior.
- No redesign or alteration to Figma spacing, sizing, typography, card content, or routes.
- No changes to private account actions or production content.

## Acceptance criteria

1. Eligible cards have a visible but restrained hover affordance on a desktop pointer.
2. Keyboard focus within an eligible card produces the same affordance.
3. Reduced-motion mode yields no transform or animated transition for eligible cards.
4. Narrow viewport layout has no horizontal overflow attributable to the shared motion surface.
5. Typecheck and production build remain successful.

## Risks and mitigations

- Transforms can visually cross adjacent cards. Keep translation to 3px, use a low-opacity shadow, and verify carousel/grid edges at desktop and phone widths.
- Reduced-motion users can be affected by hover transforms even when durations are near zero. Explicitly disable both transform and shadow in the reduced-motion rule.
