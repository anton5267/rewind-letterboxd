# Inter

Local normal and italic variable fonts from the official [Inter repository](https://github.com/rsms/inter), pinned to commit `353b61b9f4430d5f420d56605a6e7993e0941470` (`docs/font-files/InterVariable.woff2` and `InterVariable-Italic.woff2`). The unmodified SIL Open Font License is included in `LICENSE.txt`.

The REWIND implementation memo selects Inter, including Cyrillic. `global.css` loads both local files with `font-display: swap`; no external font service is required. The browser audit confirmed the Cyrillic probe, including Ґ/Є/І/Ї, used the custom Inter Variable font.
