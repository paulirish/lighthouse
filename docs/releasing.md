### Release guide for maintainers

## Release Policy

### Cadence

We ship once a month, on the Thursday before the 1st. While not necessary, followup minor/patch releases may be done if warranted. The planned ship dates are added to the internal Lighthouse calendar.

### Release manager

Release manager is appointed, according to the list below. However, if the appointed manager is absent, the next engineer in line in the list would own it.

    bckenny, paulirish, patrickhulce

Release manager follows the below _Release Process_.

### Release publicity

1. Release mgr copies changelog to a new [Releases](https://github.com/GoogleChrome/lighthouse/releases). Tags and ships it.
   * Include a line of `We expect this release to ship in the DevTools of Chrome XX`.
1. Release mgr tells the _LH public_ Hangout chat about the new version.
1. V & Kayce write and publish the [/updates](https://developers.google.com/web/updates/) blog post
1. Paul writes the tweet (linking the /updates post) and sends it on [@____lighthouse](https://twitter.com/____lighthouse).
1. Paul prepares a roll for DevTools frontend

### Versioning

We follow [semver](https://semver.org/) versioning semantics (`vMajor.Minor.Patch`), to align with the greater Node community. Generally, this means our bi-weekly releases will bump a minor. Though we will release a new patch version if high-priority fixes are required before the next schedule release. Additionally, if a schedule release contains no new features, then we'll only bump the patch version.


## Release Process

```sh
# use a custom lighthouse-pristine checkout to make sure your dev files aren't involved.

# * Install the latest.*
yarn

# * Bump it *
yarn version --no-git-tag-version
# manually bump extension v in clients/extension/manifest.json
yarn update:sample-json

# * Build it. This also builds the cli, extension, and viewer. *
yarn build-all

# * Test err'thing *
echo "Test the CLI."
yarn start "https://example.com"
yarn smoke

echo "Test the extension"
# ...

echo "Test a fresh local install"
# (starting from lighthouse-pristine root...)
npm pack
cd ..; rm -rf tmp; mkdir tmp; cd tmp
npm init -y
npm install ../lighthouse-pristine/lighthouse-*.tgz
npm explore lighthouse -- npm run smoke
npm explore lighthouse -- npm run chrome # try the manual launcher
npm explore lighthouse -- npm run fast -- http://example.com
cd ..; rm -rf ./tmp;

cd ../lighthouse-pristine; command rm -f lighthouse-*.tgz

echo "Test the lighthouse-viewer build"
# Manual test for now:
# Start a server in dist/viewer/ and open the page in a tab. You should see the viewer.
# Drop in a results.json or paste an existing gist url (e.g. https://gist.github.com/ebidel/b9fd478b5f40bf5fab174439dc18f83a).
# Check for errors!
cd dist/viewer ; python -m SimpleHTTPServer
# go to http://localhost:8000/

# * Update changelog *
git fetch --tags
yarn changelog
# add new contributors, e.g. from git shortlog -s -e -n v2.3.0..HEAD
#    and https://github.com/GoogleChrome/lighthouse/graphs/contributors
echo "Edit the changelog for readability and brevity"

# * Put up the PR *
echo "Branch and commit the version bump."
git checkout -b bumpv240
git commit -am "2.4.0"
echo "Generate a PR and get it merged."

echo "Once it's merged, pull master and tag the (squashed) commit"
git tag -a v2.4.0 -m "v2.4.0"
git push --tags


# * Deploy-time *
echo "Rebuild extension and viewer to get the latest, tagged master commit"
yarn build-all;

# zip the extension files
node build/build-extension.js package; cd dist/extension-package/
echo "Go here: https://chrome.google.com/webstore/developer/edit/blipmdconlkpinefehnmjammfjpmpbjk "
echo "Upload the package zip to CWS dev dashboard"
# Be in lighthouse-extension-owners group
# Open <https://chrome.google.com/webstore/developer/dashboard>
# Click _Edit_ on lighthouse
# _Upload Updated Package_
# Select `lighthouse-4.X.X.zip`
# _Publish_ at the bottom

echo "Verify the npm package won't include unncessary files"
npm pack --dry-run
npx pkgfiles

echo "ship it"
npm publish
yarn deploy-viewer

# * Tell the world!!! *
echo "Complete the _Release publicity_ tasks documented above"
```
