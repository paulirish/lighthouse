#!/usr/bin/env bash

##
# @license Copyright 2020 The Lighthouse Authors. All Rights Reserved.
# Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
# Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
##

set -euo pipefail

# Overview:
# - build-tracker relies on a common commit that's shared between HEAD and master.
# - Lighthouse runs on pull_request, not merge, so the checkout is not the branch with shared history, but the result of a merge.
# - checkout@v2 uses a merge remote (eg. remotes/pull/9605/merge) that just has a single commit. Handy, but there's no history.
# - This script creates a new branch that matches the current checkout, but does have a shared history.

# See also
# - https://github.com/paularmstrong/build-tracker/issues/106
# - https://github.com/paularmstrong/build-tracker/issues/200

# We can always use some more history
git fetch --deepen=100

if git merge-base HEAD origin/master > /dev/null; then
  echo "We have a common commit w/ origin/master. Skipping this script…";
  exit 0
else
  echo "We don't have a common commit w/ origin/master. We'll checkout the associated branch, merge master, and then we'll be good"
fi

# get the human readable remote name
checkout_name=$(git describe --all --exact-match HEAD)


# We only want to keep going if it's a 'remotes/pull/{*}/merge'
if [[ $checkout_name != remotes/pull/*/merge  ]]; then
  echo "Don't know how to handle this checkout ($checkout_name). 🤔 Bailing.";
  exit 0;
fi

# Extract 9605 from 'remotes/pull/9605/merge'
pr_num=${checkout_name//[!0-9]/}

lsremote_hash=$(git ls-remote origin "refs/pull/$pr_num/head" | cut -f1)

if [ -z "$lsremote_hash" ]; then
  echo "ls-remote failed to find this PR's branch. 🤔 Bailing.";
  exit 0;
fi

# Checkout our PR branch
git checkout --progress --force "$lsremote_hash"

# Branch off, for safekeeping
mergebranch_name="_bt_mergebranch-$pr_num"
git checkout -b "$mergebranch_name"


git merge --no-verify -m "Merge remote-tracking branch 'origin/master' into $mergebranch_name" origin/master

# If there's a diff aginst where we started.. we fucked up
if git --no-pager diff --color=always --exit-code "$checkout_name" > /dev/null; then
  echo "No diff, good!"
else
  echo "Unexpected difference between $mergebranch_name and $checkout_name. Bailing";
  exit 0;
fi

# Lastly, now we should definitely have a merge-base.
if git merge-base HEAD origin/master > /dev/null; then
  echo "Merge-base found. Perfect. 👌"
else
  echo "No diff, but still no merge-base. Very unexpected. 🤔"
fi
