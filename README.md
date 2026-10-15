# Retiam documentation

Standalone React documentation, tutorials, API reference, and editable examples for [Retiam](https://github.com/abhilasbiswas/Retiam).

**[Read the documentation](https://abhilasbiswas.github.io/retiam-docs/)**

## Development

Use Node.js 24.

```bash
npm ci
npm run dev
```

Open [localhost:4000](http://localhost:4000/). This project installs and builds without a Retiam source checkout. Live scenes load the engine URL in [content/config.json](content/config.json), currently `http://localhost:3000/retiam.es.js`. Run that CDN separately when previewing scenes locally.

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

The public site includes documentation examples and API descriptions. It does not copy private engine implementation files or provide implementation-source downloads.

## Library version

Before the first npm release, the development dependency uses `vendor/retiam-1.0.0.tgz`, a packaged library release containing compiled modules, declarations, assets, and CLI tools. It has no link to the private checkout. This archive is for local development until the library is ready to be published.

Once the version exists on npm, replace the bootstrap dependency:

```bash
npm install --save-dev retiam@1.0.0
```

Then remove the unused archive from `vendor/` and commit `package.json` and `package-lock.json`. Update `content/config.json` to the matching public CDN module URL before publishing the site.

API metadata is checked in so routine builds need no engine source. After an engine release, a maintainer with source access can refresh it explicitly:

```bash
npm run reference:import -- /path/to/Retiam
```

This optional command reads the private checkout to update reference data; it copies no implementation files. Commit the refreshed snapshot alongside the matching package version and documentation changes. Updating a library dependency alone does not regenerate the API reference.

## GitHub Pages

Publish this project as the public `retiam-docs` repository. Set **Settings → Pages → Source → GitHub Actions** and push to `main`. The included workflow installs, tests, builds, checks, and deploys this repository without accessing the engine repository.

See [DEPLOYMENT.md](DEPLOYMENT.md) for local deployment checks and optional services.

## License

ISC. Retiam and third-party assets retain their respective licenses.
