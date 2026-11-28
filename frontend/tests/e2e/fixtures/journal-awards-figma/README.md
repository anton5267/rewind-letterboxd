# Journal Awards READY cover fixtures

These local-only PNG exports capture the five main artwork layers from READY desktop frame `604:967` in Figma file `BDO9GO1oscOeUTcu4VXVKA`. They are used by `journal-design-flow.spec.ts` to verify the order, source dimensions, and image loading of the five Awards feed covers. The browser test serves them from a fixture-only hostname; production Journal URLs remain API-driven.

| File | Story | Figma node | Source size |
| --- | --- | --- | --- |
| `award-cover-01.png` | Best in Show: Streaming Giants | `604:1044` | 515×296 |
| `award-cover-02.png` | Voices of Animation | `604:1048` | 444×407 |
| `award-cover-03.png` | Documentary Dreams | `604:1068` | 444×407 |
| `award-cover-04.png` | Best in Show: British & American Cinema | `604:1022` | 442×408 |
| `award-cover-05.png` | Best in Show: Musical Moments | `604:1023` | 442×408 |

The Figma frame also has separate poster stacks on the right side of these desktop cards. These cover exports do not claim parity for those stacks; the current Journal response has no separate poster-stack field. No static Figma image is referenced by production runtime code.
