# Lighthouse Viewer

Online at https://googlechrome.github.io/lighthouse/viewer/

## Development

Run the following in the root folder of a Lighthouse checkout:

* `yarn`
* `yarn build-viewer`

This compiles and minifies `app/src/main.js` using uglify-es. Results are written to `dist/viewer/`.

## Deploy

Deploys should be done as part of the Lighthouse release process. To push the viewer to the `gh-pages` branch under `viewer/`, run the following in the root folder of a Lighthouse checkout:

```sh
yarn deploy-viewer
```

For more information on deployment, see `releasing.md`.
