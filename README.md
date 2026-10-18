# Retiam documentation

Standalone React documentation, tutorials, API reference, and editable examples for [Retiam](https://github.com/abhilasbiswas/Retiam).

**[Read the documentation](https://abhilasbiswas.github.io/retiam-docs/)**

The handbook covers all three application workflows:

| Workflow | Guide |
| --- | --- |
| Create a TypeScript project with Studio, render video and capture snapshots | [Project setup](https://abhilasbiswas.github.io/retiam-docs/installation/#create-with-studio) and [rendering](https://abhilasbiswas.github.io/retiam-docs/export/#cli-preview-and-final-render) |
| Run a scene directly in a browser through jsDelivr | [CDN import-map example](https://abhilasbiswas.github.io/retiam-docs/installation/#use-the-cdn) |
| Build a web component and host it on another website | [Independent npm embed recipe](https://abhilasbiswas.github.io/retiam-docs/export/#embed-from-npm) |

## Development

Use Node.js 24.

```bash
npm ci
npm run dev
```

Open [localhost:4000](http://localhost:4000/). This project installs, tests, and builds without the Retiam npm package or a Retiam source checkout. Live scenes load the published Retiam module configured in [content/config.json](content/config.json). Local previews use the same public CDN as the deployed site.

```bash
npm run lint
npm test
npm run build
npm run preview
```

The production website is written to `dist/`. Keep generated files, dependencies, and build output out of Git.

## Content and examples

- `content/`: authored guides, API notes, navigation, and focused playground scenes.
- `examples/`: documentation-owned copies of the example collection and its registry.
- `assets/`: media and font descriptors required by those examples.
- `reference/engine.json.gz`: versioned API metadata, hierarchy, and export information.
- `src/`: React viewer, editor, search, and navigation.
- `scripts/`: content validation, runtime preparation, tests, and reference maintenance.

See [AUTHORING.md](AUTHORING.md) for the content format. Edit examples and their notes together. Their media is fetched when the relevant scene runs.

The getting-started guides cover `npx create-retiam@latest`, the generated Studio,
and video rendering with the project's `config.js`. See
[installation](content/guides/start-here/installation.json),
[Studio and tooling](content/guides/production-and-tooling/tooling.json), and
[rendering and export](content/guides/production-and-tooling/export.json).

The full config example lives in
[content/playgrounds/render-config.js](content/playgrounds/render-config.js).
It mirrors `packages/create-retiam/starter/config.js` in the engine repository;
update the example when render defaults change. The documentation build embeds
this local copy and needs no engine checkout.

Generated projects use `"retiam": "latest"`.
The initial install resolves npm's latest engine release, while the project's
lockfile records the installed version. This is separate from this documentation
site's CDN configuration below.

The public site includes documentation examples and API descriptions. It does not copy private engine implementation files or provide implementation-source downloads.

## Library version

Live examples use the module URL configured in `content/config.json`. To change
their engine version, update that URL, verify the examples in a WebGPU browser,
and redeploy. The documentation has no installed engine dependency, engine CLI
checks, or comparisons against examples in the engine repository.

Publish the required engine release before pointing the documentation runtime
or a `create-retiam` starter at that release. Guides describe the current workflow;
the live example runtime uses the configured engine module.

API metadata is checked in so routine builds need no engine source. After an engine release, a maintainer with source access can refresh it explicitly:

```bash
npm run reference:import -- /path/to/Retiam
```

This optional maintainer command reads the private checkout to update reference data; it copies no implementation files and is never run by installation, tests, builds, or deployment checks. Commit the refreshed snapshot alongside the relevant documentation changes. Changing the CDN URL does not regenerate the API reference.

## GitHub Pages

Publish this project as the public `retiam-docs` repository. Set **Settings → Pages → Source → GitHub Actions** and push to `main`. The included workflow installs, tests, builds, checks, and deploys this repository without accessing the engine repository.

Live demos load Retiam from the public CDN, which the workflow checks before deploying. See [DEPLOYMENT.md](DEPLOYMENT.md) for checks and optional services.

## License

ISC. Retiam and third-party assets retain their respective licenses.
