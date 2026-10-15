# Retiam Documentation Authoring Guide

Author one JSON file per page in `content/`, then embed repository scenes or separate TypeScript labs where readers should experiment. React renders the shared block schema from compiled page assets. API signatures and member links come from the versioned reference snapshot; example source is owned by this project; keep their explanations in small topic note files.

This guide covers the structure of the JSON file, the available content blocks, and best practices.

---

## 1. Files and page structure

```text
content/
  config.json              # Global playground configuration
  navigation.json          # Groups and page order
  coverage.json            # Source-to-documentation mappings
  guides/<topic>/*.json     # Tutorials and explanations
  api/<group>/*.json        # API references
  catalogs/demos/*.json     # Demo catalog pages
  catalogs/shaders/*.json   # WGSL reference pages
  notebooks/*.json          # Historical engineering documents
  playgrounds/*.ts          # Documentation-only interactive labs
  api-notes/*.json          # Behavior and parameter explanations
  example-notes/*.json      # Walkthroughs, experiments and controls
```

The three top-level JSON files are manifests. Page discovery searches recursively
inside subfolders; you may add topic folders and move pages without changing routes.
Each page is registered exactly once in `content/navigation.json`.

### Configuration

Set the Retiam CDN module URL in `content/config.json`:

```json
{
  "cdnUrl": "http://localhost:3000/retiam.es.js"
}
```

Set `cdnUrl` in `content/config.json` to select the engine module used by the viewer.

```json
{
  "cdnUrl": "https://cdn.jsdelivr.net/npm/retiam@1.0.0/dist/retiam.es.js"
}
```

Replace the version with the one you published. The example viewer's import map
also resolves sublibraries such as `retiam/charts` under the engine URL's directory.
The documentation treats this module as an external dependency and does not compare
source hashes or require the CDN to come from the same repository checkout.

With the default local URL, run the engine's CDN separately on port 3000 before starting `npm run dev` in this project. For deployment, use a pinned npm
version instead of a moving `latest` URL and enable CORS for the documentation
origin. Rebuild the docs after changing the URL; the development server watches
this setting automatically.

### Navigation

`content/navigation.json` controls sidebar group order, page order within groups,
and previous/next links. Entries use page IDs rather than filenames:

```json
{
  "groups": [
    { "title": "Start here", "kind": "guide", "pages": ["getting-started", "installation"] },
    { "title": "Engine API", "kind": "reference", "pages": ["api-core-scene"] }
  ]
}
```

This is an abbreviated example. Preserve the other existing entries when editing
navigation. A page's `group` must match its navigation group's `title`.
`kind` defaults to `guide`. Guide groups form the continuous reading sequence;
reference pages have Previous/Next links within their own group. The sidebar
remembers expanded groups and opens the active page's group automatically.

### Pages

Each page file contains one page object. For example,
`content/guides/start-here/my-guide.json` could contain:

```json
{
  "$schema": "../../../src/data/docs-authoring-schema.json",
  "id": "my-guide",
  "group": "Start here",
  "title": "My guide",
  "summary": "Explain the specific behavior this guide teaches.",
  "prerequisites": ["[Your first scene](/first-scene)"],
  "outcome": "State the concrete result of completing this tutorial.",
  "sections": [
    {
      "id": "introduction",
      "blocks": [
        { "type": "heading", "level": 2, "text": "Introduction" },
        { "type": "paragraph", "text": "Explain the feature here." }
      ]
    }
  ]
}
```

- **`$schema`**: editor validation/autocomplete; its path is relative to the page file.
- **`id`**: stable URL slug, such as `/my-guide`; independent of file location.
- **`group`**: sidebar category, matching `navigation.json`.
- **`title`**: display name in navigation, breadcrumbs and the page's main heading.
- **`summary`**: concise purpose statement below the main heading. Author this for
  guides; API, example, shader and notebook references have generated fallbacks.
- **`prerequisites`**: optional inline links to earlier guides, validated like body links.
- **`outcome`**: optional expected result for a tutorial or project.
- **`sections`**: the page's ordered sections.

Register `my-guide` in the `Start here` group's `pages` array. Filesystem ordering
has no effect on navigation. Keep existing page and section IDs stable.

### Sections
A page is broken down into `sections`. Each section can be linked to directly (via anchor links) and appears in the right-hand "On this page" Table of Contents.

```json
{
  "id": "section-intro",
  "blocks": [ ... ]
}
```
- **`id`**: The HTML id used for scrolling and linking (e.g., `#section-intro`).
- **`blocks`**: An array of content blocks that render vertically. The first block should usually be a `heading`.

---

## 2. Content Blocks

Content blocks are the building blocks of your documentation. Every block requires a `"type"` property.

### Paragraph
Renders standard text. Supports markdown for code (` `), **bold**, _italic_, mathematical equations (`$ $`), and [links](#). Note that internal links starting with `#` or `/` will cleanly route within the app, while `http` links will open in a new tab.

Formatting can be nested: `**[\`Scene\`](/api-core-scene#scene)**` renders a bold
link with a code label. Link labels render their formatting without adding nested
API links. Use `<br/>` for an explicit line break and a backslash to escape a
literal Markdown delimiter.

```json
{
  "type": "paragraph",
  "text": "The `Scene` class is the foundational container..."
}
```

### Heading
Creates a section heading. The page's `title` supplies its single main heading;
start sections at `"level": 2` and use deeper levels within them. Historical
level-1 blocks render at level 2 while retaining their section anchors.

```json
{
  "type": "heading",
  "level": 2,
  "text": "Properties"
}
```

### Callout
Used to draw attention to important information, warnings, or tips.
- **`variant`**: `"info"`, `"warning"`, `"danger"`, or `"success"`.

```json
{
  "type": "callout",
  "variant": "info",
  "content": "**Heads Up:** Ensure your dev server is running."
}
```

### Code
Renders a syntax-highlighted code block with a built-in "Copy to Clipboard" button.

```json
{
  "type": "code",
  "language": "typescript",
  "code": "const scene = new Scene(canvas);"
}
```

### Diagrams (Mermaid)

A code block with `"language": "mermaid"` renders as a diagram automatically.
Use the same schema for flowcharts, sequence diagrams, state diagrams, timelines,
and other [Mermaid diagram types](https://mermaid.js.org/intro/).

```json
{
  "type": "code",
  "language": "mermaid",
  "code": "flowchart LR\n  Scene --> Update\n  Update --> Render\n  Render --> Frame"
}
```

Diagrams have no toolbar or footer. Readers zoom around the pointer with
**Ctrl/⌘ + mouse wheel**, drag to pan, or pinch on a touchscreen. Small diagrams
use enough height to show fully; large diagrams have a taller canvas and retain
readable text. Corner icons reset the view and open/close fullscreen. With the
canvas focused, **+ / −** zoom, **0** resets, and arrow keys pan. Rendering failures
include the original source and a retry button.
The diagram follows the site's light/dark theme. Quote labels containing
punctuation, for example `A["scene.play()"]`, and use `<br/>` for line breaks.
Mermaid's strict rendering mode disables author-defined click callbacks. The
viewer links registered API identifiers in node labels, including a name beside
an explanation, while preserving positioned text and line breaks. Invalid
syntax displays an error with the original source, so the page stays readable.
The Mermaid library loads only when a page contains a Mermaid block.

### Legacy playground block
The original playground block remains supported for compatibility. Prefer the
source-based `example` block described below for new interactive scenes: it
shares canonical files, supports sublibraries, and contains scene DOM/listeners
inside a disposable viewer.

```json
{
  "type": "playground",
  "id": "my-guide-example",
  "filename": "FirstScene.ts",
  "codeFile": "playgrounds/pg-firstscene.ts"
}
```

`codeFile` is relative to `content/` and must point inside `content/playgrounds/`.
The builder embeds its exact contents into the existing runtime `code` field.
References also work in `code` blocks and inside tabs. Use either `codeFile` or
inline `code`, never both. Inline code remains convenient for short fragments.

Core playgrounds receive Retiam's runtime exports automatically. Follow the existing
`pg-firstscene.ts` example: export a default class extending `Scene`; do not add
imports that duplicate the automatically supplied core names. The content verifier
checks these files using the engine's exports and types. They are example inputs,
so they are outside the React application's TypeScript compilation.

### Table
Creates a structured data table, perfect for API references (Properties, Methods).

Tables scroll horizontally within the page on small screens. Column labels such
as `Property`, `Parameter` or `Name` infer code cells; a `Type` column uses type
styling. Other columns render prose. Markdown in a cell takes precedence over
inferred code styling. Set a cell's `type` to `code`, `type` or `text` explicitly
when needed. Column objects can specify `label` and `width`.

```json
{
  "type": "table",
  "columns": ["Property", "Type", "Description"],
  "rows": [
    { "cells": ["camera", "Camera", "The main camera."] },
    { "cells": ["time", "number", "Engine up-time in ms."] }
  ]
}
```

### List
Use strings for a simple list. For nested lists, use an item object with `text`
and `children`; the text supports the same inline Markdown as a paragraph.
Set `ordered` on an item to number its children. Set `start` on an ordered list
or parent item when numbering continues after an equation or another block.

```json
{
  "type": "list",
  "ordered": true,
  "items": [
    {
      "text": "Render the world view.",
      "children": ["Draw scene entities.", "Clear color and depth."]
    },
    {
      "text": "Render the UI overlay.",
      "children": ["Preserve the scene color.", "Clear depth for the overlay."]
    }
  ]
}
```

Creates bulleted or numbered lists. Supports inline markdown.

```json
{
  "type": "list",
  "ordered": false,
  "items": [
    "First item",
    "Second item with **bold** text"
  ]
}
```

### Tree
Creates a hierarchical tree structure, ideal for showing class hierarchies or file structures. 
Supports three visual `variant`s: `"horizontal"` (default node graph), `"vertical"` (org-chart), and `"folder"` (file explorer).

```json
{
  "type": "tree",
  "variant": "horizontal",
  "nodes": [
    {
      "label": "Entity (base)",
      "description": "Shared state, components and child ownership.",
      "children": [
        {
          "label": "VectorEntity",
          "children": [
            { "label": "Path" },
            { "label": "Rect" }
          ]
        },
        { "label": "Model" }
      ]
    }
  ]
}
```

Use `description` for each node's secondary explanation rather than adding long
parenthetical labels. Descriptions support inline Markdown and API links. On
small screens, graph variants become indented hierarchies; folder trees wrap long
paths. Use a tree for ownership, inheritance and files. Use Mermaid for a process
with arrows, shared dependencies, cycles or bidirectional relationships.

### Link (Reference Card)
Renders a premium, full-width "Reference Card" perfect for prominent links to external sites (like GitHub) or major cross-references.

```json
{
  "type": "link",
  "url": "https://github.com/abhilasbiswas/Retiam",
  "title": "Retiam GitHub Repository",
  "description": "View the source code and contribute.",
  "icon": "github"
}
```
*Supported icons: `github`, `link`, `article`, or any standard Google Material Symbol name.*

### Image & Video
Embeds media with optional captions and layout controls.

```json
{
  "type": "image",
  "url": "/assets/diagram.png",
  "alt": "Architecture Diagram",
  "caption": "Figure 1: High-level architecture",
  "align": "center",
  "width": "80%"
}
```

```json
{
  "type": "video",
  "url": "/assets/demo.mp4",
  "autoplay": true,
  "loop": true,
  "muted": true,
  "align": "center"
}
```

### Math
Renders standalone LaTeX block equations using KaTeX. (Use `$ equation $` inside paragraphs for inline math).

```json
{
  "type": "math",
  "tex": "E = mc^2"
}
```

### Tabs
Allows grouping multiple blocks into selectable tabs (useful for showing code in multiple languages or framework setups).

```json
{
  "type": "tabs",
  "tabs": [
    {
      "label": "npm",
      "blocks": [
        { "type": "code", "language": "bash", "code": "npm install retiam" }
      ]
    },
    {
      "label": "yarn",
      "blocks": [
        { "type": "code", "language": "bash", "code": "yarn add retiam" }
      ]
    }
  ]
}
```

---

## 3. Best Practices & Workflow

1. **Avoid Duplication:** Do not use a `<Heading level={1}>` if the `page.title` already accurately describes the page; the site uses breadcrumbs for the `page.title`. However, you *must* use a Heading block as the first item in a Section for it to show up in the Table of Contents.
2. **Search Indexing:** The build generates search records for current API members, examples, tables and guide sections. Global Search (`Ctrl+K`) loads them on demand. Exact API names rank ahead of mentions, and readers can filter guides, APIs or examples. Historical declaration snapshots remain readable but are excluded from search to avoid duplicating the current API results.
3. **Cross-Referencing:** Use standard markdown `[text](#section-id)` inside paragraphs to link to other sections on the same page. Use `[text](/page-id#section-id)` to link to different pages.
4. **Validation:** To get real-time autocomplete and validation in your editor (like VS Code), each page links to `src/data/docs-authoring-schema.json` through its `$schema` property. The authoring schema supports external code files and is derived from the existing runtime schema. If you add new block types to `src/types.ts` in the future, you can regenerate the schema by running: `npm run gen:schema`.

## 4. Handbook organization and verification

The content is organized into current learning guides, source-derived API references,
the complete demo and WGSL catalogs, and an explicitly historical engineering
notebook archive. Keep executable examples in the current guides. Notebook sketches
and benchmark reports are retained for rationale and must not be presented as verified
current programs or universal performance guarantees.

API entries include exported-symbol inventories, declared defaults, source fallback
expressions, and private/file-local helper notes. Mechanically extracted body
operations list assignments, constructions, calls and return paths, including nested
callbacks; they do not establish execution order. Source-line links support each
member. Keep these notes distinct from conceptual explanations and executable code.

Run `npm run verify:content` from the `retiam-docs` root after editing pages or examples. This checks the
checked-in schema, page/section/playground IDs, table widths, internal links, coverage
destinations, and TypeScript for the guide playgrounds and complete class examples.
It uses the root engine's installed TypeScript compiler and source types, so install
the root dependencies first. It does not execute the GPU code, validate every
integration fragment, or certify the historical sketches.

`content/coverage.json` records exports, package entry points and file-to-page
mapping for every TypeScript implementation, WGSL shader, demo module and original
engineering document. Add a coverage record and a reference destination when adding
a source file. Content verification checks the mapping, not the source file bytes.

Then run `npm run build` and verify affected pages in a WebGPU browser. The build runs content verification before checking React types and bundling the
viewer. Fragmentary and historical examples still require manual review. Check intermediate frames, console output, navigation,
and search. The source-based viewer supplies the package import map for core and
sublibrary examples. Standalone applications must configure their own bundler or
import map.


## 5. Editing and building

Run commands from the `retiam-docs` root:

```sh
npm run dev              # Prepare example viewers and watch documentation content, examples and assets
npm run build:content    # Assemble and validate pages/navigation/links
npm run verify:content   # Also verify coverage and example TypeScript
npm run test:content     # Check content-loader and search integration cases
npm run test:scenes      # Lint comparison, project and workshop scenes with Retiam's CLI
npm run test:consumer    # Type-check the documented npm and React hosts through package exports
npm run build            # Verify content, check React types, and build production assets
```

`npm run dev` prepares the documentation runtime and starts this server. With the default engine URL, run the local engine CDN separately at port 3000. The documentation build uses its installed library dependency for type checks; it does not read the CDN server's source checkout.

To add a page:

1. Copy a page template into a suitable `content/` subfolder.
2. Give it a unique page ID and stable section IDs. Start every section with a heading.
3. Add its ID once to the matching group in `content/navigation.json`.
4. Embed a repository demo with an `example` block, or add an authored lab under `content/playgrounds/` and use its `labs/<filename>` ID.
5. Run verification and inspect the page in the browser.

To move a page, preserve its IDs, update its relative `$schema` path, and keep the
navigation entry. To remove one, remove its navigation entry and update incoming
links and coverage destinations. Verification rejects stale references.

The build script writes `src/data/generated/page-catalog.json`, `search-index.json`,
and one resolved JSON asset per page under `src/data/generated/pages/`. These files
are ignored by Git and recreated automatically. The React site initially loads the
catalog, fetches the active page, and fetches search records when search opens. It
caches successful requests for the session and offers retries after failed requests.

The development server watches content, documentation examples, reference data and assets, rebuilds successful edits, and refreshes
the browser. Invalid edits produce an error overlay; fix the source to rebuild.
Production previews show the last production build, so rebuild before checking them.

API pages retain the earlier reference material in expandable panels and add
current declarations and member navigation loaded from the versioned reference snapshot. The page
format remains JSON; prose uses the existing inline formatting renderer.

## Source-based examples and API navigation

Use an `example` block to run a canonical repository scene inside a page:

```json
{ "type": "example", "example": "interaction/interactive_bezier" }
```

The ID is the path below `examples/demos/`, without `.ts`. Documentation-only
experiments use `labs/<filename>` and live in `content/playgrounds/`. The same ID
can be embedded in a guide, an example category and an API explanation. Discovery
reads exported Scene classes and the existing Studio registry. Supporting data
modules get a source viewer rather than a Start button.

Add explanations in `content/example-notes/<topic>.json`, keyed by example ID:

```json
{
  "interaction/interactive_bezier": {
    "description": "Drag a control point and watch the curve respond.",
    "walkthrough": ["Explain how the inputs reach the rendered geometry."],
    "experiments": ["Suggest a specific change and what to look for."],
    "requirements": ["List assets or services this scene actually needs."],
    "related": ["Bezier", "InteractionComponent"]
  }
}
```

Readers experiment by editing the source beside the preview. Explain which values
or calls to change and what the change demonstrates. Runnable scenes start when
any part of their preview enters the viewport and keep playing until the preview
is fully off-screen. Multiple visible previews can play together. Starting another
embedded example releases off-screen viewers; scrolling back starts them again
with the current editor contents. Leaving a page disposes the viewer frames.

The documentation build compiles the original modules and their relative helpers,
copies referenced media and their dependent assets, and hosts one minified
TypeScript compiler locally. The same AST transform resolves original and edited
demo URLs under the configured deployment base. Built-in font aliases load emitted
library assets from the engine CDN; explicit MSDF descriptors and their atlases
used by a demo remain generated documentation assets. Demos with setup requirements
start only after an explicit Run and explain missing service configuration.
The viewer imports the engine and sublibraries from `cdnUrl`, which is initially
set to the separate engine server on port 3000. Editor drafts are saved
in browser storage under the example ID and a hash of its canonical source. They
survive navigation and reloads; a changed canonical file starts a new draft revision.
Reset Code clears that revision's draft and returns to the canonical file. If
storage is unavailable, the current tab retains drafts across navigation and tells
the reader to copy them before closing it. Run Scene (or Ctrl/⌘+Enter) applies changes;
Live Auto-Run applies them after a short typing pause. Preserve State carries
the camera, scene clock and pause flag between runs; it does not replay or restore
every entity and animation. View Settings toggles code, preview and console panels.
Hiding code gives the preview the full workbench area. There is no separate
playback or parameter panel below the editor.
The editable runner transpiles TypeScript and
reports syntax/runtime errors; it does not provide semantic type checking.

A provider service, a missing asset, or a model download can still be required by
a particular repository demo. Document these dependencies accurately. A module
being discovered or compiling successfully does not prove that its scene runs.

Use an `api-reference` block to display source-derived declarations and members:

```json
{ "type": "api-reference", "source": "src/engine/_core/Entity.ts" }
```

Use a `class-hierarchy` block to show inheritance from the same API index:

```json
{ "type": "class-hierarchy", "root": "Animation", "depth": 1 }
```

`root` is a unique type name, an API member ID, or `source/path.ts:Type` for an
ambiguous name. `depth` is 1, 2, 3 or `"all"` (default: 2). Ancestors stay visible
when a reader focuses on a descendant. `browse: true` enables the complete type
picker and source/name search, as used on `/class-hierarchy`. A URL such as
`/class-hierarchy?type=Animation#explorer` opens a particular family; class and
interface API entries provide this link automatically.

The build resolves `extends` and `implements` through TypeScript symbols, including
imported aliases and generic bases. It writes `src/data/generated/class-hierarchy.json`
for lazy loading. Do not edit that generated file. Indexed nodes link to exact API
anchors; base declarations outside the index supply context without a guessed link.
The diagram supports drag-to-pan, Ctrl/⌘ + wheel zoom, touch pinch, reset,
fullscreen and a linked text list. Its connectors use separate lanes in the gaps
between columns so they do not cross type boxes. Branch colors, hover highlighting
and keyboard focus help readers trace relationships. Keyboard controls are available
on the canvas.
Solid arrows mean `extends`, dashed arrows mean `implements`; abstract classes are
italic and contracts have dashed borders. This is type inheritance; use a `tree`
block for scene ownership or folder structure.

Signatures, overloads, parameters, constructor properties, initializer expressions, JSDoc, inheritance and
source positions are refreshed from TypeScript. `content/api-notes/<topic>.json`
adds authored behavior without overwriting the generated data:

```json
{
  "Entity.rotate": {
    "description": "Add a rotation to the current orientation.",
    "notes": ["Repeated calls add rotation. Use Entity.setRotation for an absolute angle."],
    "parameters": { "angle": "A scalar uses radians." },
    "returnsDescription": "The same entity, for chaining.",
    "example": "labs/lab-transforms"
  }
}
```

Qualify duplicate declarations with `source/path.ts:Owner.member`. Notes must not
contradict the checked-out implementation. Prefer explanation of units, side
effects, ownership and useful choices over repeating the type signature.

Known symbols and source paths link to stable API targets in prose, tables,
inline code, tree labels, diagram nodes and highlighted TypeScript. Inherited member references
resolve to the declaring base type. Explicit Markdown links remain authoritative;
ambiguous symbols need a qualified reference or explicit destination. Strings and
comments in executable snippets are preserved rather than rewritten as code links.
Ordinary prose words such as State, Pass, Usage, Rate and Field stay plain; mark an intended API
reference with backticks or an explicit link. Hovering or focusing a prose API
link loads a short description and signature without leaving the guide.

The generated `src/data/generated/learning-coverage.json` distinguishes declaration
coverage from explanations and runnable scene discovery. It also counts written
walkthroughs and source-annotated examples separately. Review its
missing-explanation list when expanding the API. Never mark documentation complete
solely because a symbol appears in the index.

Every indexed declaration also carries a source contract. The reference can show
direct writes, early exits, return and yield expressions, explicit throws and call sites in
an expandable implementation section. Nested callbacks, method bodies and local
classes are excluded from that section because they have separate execution
lifetimes. Parameter usage can
include captured references; it uses TypeScript symbols to exclude shadowed names.
An inferred summary is labelled **From the implementation**, and inferred argument
usage is labelled **From source**. Authored notes and
JSDoc take precedence. The extractor does not infer units, resource ownership,
purity, all possible failures or the effects of calls into another method.
Generator bodies execute as their iterators advance; their yield values and final
completion expressions are shown separately. A conditional return expression is
not treated as proof that every branch returns that value.

`learning-coverage.json` records `described`, `narrativeDescriptions`,
`sourceDerivedDescriptions`, `sourceContracts`, `parameters` and
`narrativeParameters` separately. `apiNeedingExplanation` retains public entries
that have only a source-derived summary, even when their structural reference is
available. A nonempty description is therefore not counted as authored review.
Read the implementation and add a note when those facts need semantic context.

Validation rejects unknown API note keys, misspelled parameter names, broken
explicit links, unknown related symbols, duplicate notes and invalid scene controls.
The build also rejects runnable examples without both a written walkthrough and
an experiment, so newly discovered demos cannot silently become placeholders.
Sources longer than 300 lines additionally need a staged walkthrough of at least
four paragraphs and 160 words. This is a minimum against placeholder descriptions,
not a quality score: describe the active setup, algorithm/timeline, interaction and
integration constraints. Commented-out code and marketing labels must not be
described as active functionality or measured performance.

The Projects group contains four practical tutorials with three complete scenes
apiece. Keep each stage runnable by itself: state the behavior added in that
stage, explain its relevant API, suggest a concrete edit, and finish with the
constraints needed when integrating it into an application. Comparison labs in
the main guides isolate one distinction at a time; avoid filling them with
unrelated controls or effects.

`details` blocks keep long implementation material available without interrupting
a tutorial:

```json
{
  "type": "details",
  "title": "Inspect the implementation",
  "blocks": [{ "type": "paragraph", "text": "Supporting explanation." }]
}
```

Run `npm run verify:content`, `npm run test:content`, `npm run lint` and
`npm run build` in the `retiam-docs` root. `npm run build:runtime` rebuilds the source-based
viewer independently. Generated runtime and index files are ignored by Git.

Run `npm run test:scenes` for the comparison, project and workshop authoring
checks. `npm run test:consumer` extracts the canonical npm/React host code from
the guides and type-checks it through Retiam's packaged exports, including the
package-based custom-element embed entry. The installed Retiam dependency supplies the declarations; no source checkout or engine build is required. This check includes TSX snippets that
the complete-scene validator does not cover. A consumer runtime check must also
exercise real package assets: use the packaged files inside `node_modules`, since
a development symlink outside the project can hit Vite's filesystem allow list.
The installation guide's `optimizeDeps.exclude` preserves the package's relative
asset URLs. Type checks alone cannot detect an HTML fallback returned as a font.
Host/configuration `codeFile` snippets remain ordinary code blocks and do not
enter the runnable lab catalog. Verify them as a consumer project, with the files
and relative imports described by the guide.

`scripts/browser-checks.mjs` provides repeatable checks for a connected Codex
browser. After building and starting the docs preview and engine CDN, import it
in the browser REPL and pass a temporary tab to `checkDocsScenes(tab, baseUrl)`.
It starts all 16 comparison/project scenes and waits for their ready state.
`checkWorkshopScenes(tab, baseUrl)` starts the six focused behavior/extension labs.
`checkTutorialScenes(tab, baseUrl)` starts and restarts the four new entity,
compute, FrameGraph and plugin labs. Inspect their rendered results and exercise
the label setter, compute pause, and independent plugin toggles afterward.
`checkDocsInterface(tab, viewport, baseUrl)` verifies the desktop split, full-width
preview, mobile ordering/overflow, exact API ranking and search filters. Pass the
browser's `viewport` capability; the check restores the default viewport afterward.
`checkDocsFormatting(tab, viewport, baseUrl)` reviews ten representative pages
at desktop and mobile sizes, checking code padding, page overflow, table scroll
containers and Mermaid rendering. Its implementation lives in
`scripts/formatting-browser-checks.mjs`. Inspect both light and dark themes when
changing syntax colors, and check the mobile header controls as well as content.
These checks use the existing WebGPU browser rather than certifying all demos or
requiring a separate headless browser installation. Also inspect the scene images
and exercise picking, dragging and camera input when those behaviors change.

For the full discovery sweep, open `/runtime/check-scenes.html` on the docs server.
It runs each scene export through the same iframe viewer, records startup errors,
observes brief playback and sends pause/resume controls. Download the JSON report
with source hashes and timing metrics. Scenes with authored requirements are
reported as `requires-setup`, rather than counted as passed. Run those separately
with their fonts, media, service/model endpoints or selected stress workload.
This sweep checks startup; it does not prove that every rendered pixel, interactive
operation, complete timeline or exported video is correct. Preserve the report
with the source revision when reporting validation results.
Append `?example=sketch%2Ftex_excalifont_demo` to target one source file. After
supplying its required setup, `&includeSetup=true` includes it in the check.
Reported warnings and clock/canvas metrics also appear in its result row.

## Guide sequence and tutorials

Navigation groups support `guide`, `tutorial` and `reference`. All guide groups
share one continuous Previous/Next sequence in their sidebar order. Tutorial and
reference pages paginate within their own group. Existing page IDs remain
canonical even when their navigation group changes.

A `{ "type": "tutorial-index" }` block renders tutorial metadata with text,
difficulty and topic filters. It includes every page with tutorial metadata,
including beginner and project lessons that also belong to the guide sequence.
Search has a separate Tutorials filter as well.

Every tutorial lesson needs `summary`, `prerequisites`, `outcome`, `difficulty`
(`beginner`, `intermediate` or `advanced`) and a positive integer
`estimatedMinutes`. The tutorial index page itself is exempt. Estimates cover a
first reading; exercises can take longer. Give each lesson a small working result,
construction steps, a canonical `example` block, exercises, observable checks and
links to the relevant concept guides. Host/export tutorials can reference the
canonical project setup rather than introducing another browser bootstrap.

New tutorial labs live in `content/playgrounds/tutorial-*.ts`; their explanations
live in `content/example-notes/tutorials.json`. They participate in content type
checking, scene-authoring tests, and runtime discovery. Verify with
`npm run test:content`, `npm run test:scenes`, `npm run test:consumer` and
`npm run build`. Run the new labs in a WebGPU browser, exercise their controls,
resize the preview and restart it to check cleanup. A successful type check does
not establish GPU resource or WGSL correctness.
