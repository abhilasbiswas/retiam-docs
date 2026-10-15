# Documentation content

Edit pages here, outside the React application. See [AUTHORING.md](../AUTHORING.md)
for block examples and the full workflow.

- `config.json`: global playground settings.
- `navigation.json`: collapsible sidebar groups in reading order.
  Guides share one continuous Previous/Next sequence. Tutorial and reference
  groups paginate within their own group.
- `coverage.json`: source-to-documentation destinations and exported API mappings.
- `guides/`: learning guides, grouped by topic.
- `tutorials/`: the tutorial catalog and worked extension lessons. Existing project
  and beginner tutorials retain their original files and URLs.
- `api/`: engine, rendering/extension, and library reference pages.
- `catalogs/demos/` and `catalogs/shaders/`: demo and WGSL reference pages.
- `notebooks/`: historical engineering documents, preserved as documentation pages.
- `playgrounds/`: code referenced by `codeFile` in playground or code blocks.

Each page is one JSON file with `id`, `title`, `group`, and `sections`, following
`src/data/docs-authoring-schema.json`. Its `$schema` path is relative to that file.
Page discovery is recursive, so folders can be reorganized without changing URLs.
Add a concise `summary` for a guide's page header. Tutorial lessons require
`prerequisites` (inline links), an `outcome`, `difficulty` (`beginner`,
`intermediate`, or `advanced`), and a positive `estimatedMinutes` value. The
`tutorial-index` block lists every lesson with tutorial metadata, including
existing beginner and project guides in the linear guide sequence.
The page `title` is its main heading;
section headings begin at level 2.
Keep page IDs and section IDs stable to preserve links. Register every page ID once
in `navigation.json`; the page's `group` must match its navigation group title.

`codeFile` paths are relative to this directory and must stay inside `playgrounds/`.
Use either `codeFile` or inline `code` in a block. References also work inside tabs.
The build embeds the exact file contents into the existing runtime block format.

Run these commands from `docs-site`:

```sh
npm run dev              # Generates content; watches edits and refreshes the site
npm run build:content    # Builds pages, navigation metadata, and the search index
npm run verify:content   # Also checks source coverage and TypeScript examples
npm run build            # Verifies content, checks React types, and builds the site
```

Root dependencies are required for `verify:content` and `build`.

The pipeline writes ignored runtime assets into `src/data/generated/`. Edit their
sources here; generated files are recreated on a fresh checkout. The browser loads
the page catalog initially, the current page on demand, and the search index when
search opens. Successfully loaded pages and search data are cached for the session.

API signatures, member links, visibility and inheritance are extracted from source.
Keep explanations in `api-notes/` and scene walkthroughs in `example-notes/`.
References show public members by default and group large types by behavior;
internal/protected members remain available through a toggle or a direct link.
`class-hierarchy` blocks resolve inheritance and implemented contracts from the
same source model. Configure their root and depth in a page; the generated
hierarchy index and exact API links are refreshed during the content build.
Coverage verification flags missing files, destinations and documented exports.

API references also expose structural facts extracted from method bodies. Authored
notes and JSDoc remain the preferred explanation; inferred summaries are labelled
in the reference. `learning-coverage.json` counts authored/JSDoc descriptions and
source-derived descriptions separately and keeps the remaining narrative gaps.
Large demos require a staged walkthrough, not just a caption.

After a build, `/runtime/check-scenes.html` runs a startup/brief-playback sweep over
all discovered exports and downloads a report. Extra-setup examples are reported
separately. Follow it with focused interaction and export checks for the behavior
being changed; a ready signal alone does not certify a whole scene.
