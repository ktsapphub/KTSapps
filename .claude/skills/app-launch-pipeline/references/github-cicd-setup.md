# GitHub CI/CD + Branch Protection Setup

## ci.yml template (adapt job details to the actual stack)

```yaml
name: CI

on:
  pull_request:
    branches: [staging, main]
  push:
    branches: [staging, main]

# Required once the repo is private -- default GITHUB_TOKEN needs explicit
# read access to PR data for gitleaks (or similar tools) to work.
permissions:
  contents: read
  pull-requests: read

jobs:
  backend:
    name: Backend (pytest)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'   # match whatever the deploy target is pinned to
          cache: 'pip'
      - run: pip install -r requirements.txt
      - run: pytest -q
        continue-on-error: true  # if the test suite is integration-style and needs a live seeded server -- see known-failures.md

  frontend:
    name: Frontend (build)
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'yarn'
      - run: yarn install --frozen-lockfile
      - run: yarn build
        env:
          CI: false

  secret-scan:
    name: Scan for leaked secrets
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0   # REQUIRED -- gitleaks compares commit to parent, shallow clone breaks this
      - uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## visibility-gate.yml template

```yaml
name: Repo Visibility Gate

on:
  pull_request:
    branches: [main]

jobs:
  check-visibility:
    name: Check repo visibility
    runs-on: ubuntu-latest
    steps:
      - name: Query repo visibility
        id: visibility
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          IS_PRIVATE=$(curl -s \
            -H "Authorization: Bearer $GH_TOKEN" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/repos/${{ github.repository }} \
            | jq -r '.private')
          echo "is_private=$IS_PRIVATE" >> "$GITHUB_OUTPUT"
      - name: Fail if still public
        if: steps.visibility.outputs.is_private == 'false'
        run: |
          echo "::error::This repo is still PUBLIC and this PR targets main."
          echo "::error::Go to Settings > General > Danger Zone > Change visibility > Make private, before merging."
          echo "::error::Once private, re-run this check and it will pass."
          exit 1
```

## Retrofit sequence for a repo that already has code on `main`

1. Create `staging` branch from current `main` (identical at this point -- expected).
2. Add `ci.yml` via a normal, direct push to `main` -- the one intentional exception, since a status check can't be required as "must pass" until GitHub has seen it run at least once.
3. Confirm the workflow actually ran (check the Actions tab) before proceeding.
4. Add branch protection rules now that the check exists to select.
5. Add `visibility-gate.yml` the same way (direct push is fine here too, or bundle with step 2).
6. All future changes: PR only, from this point forward.

## Branch protection settings (GitHub's "Rulesets" UI)

**For `main`:**
- Enforcement status: **Active** (easy to leave on Disabled by mistake)
- Target: `main` specifically (use "Include by pattern" if "Include default branch" isn't offered, or if the ruleset needs to be explicit)
- Require a pull request before merging: checked, **Required approvals: 1** (default is 0 -- must be changed explicitly)
- Require status checks to pass: checked, add each job by its exact reported name (e.g., `Backend (pytest)`, not the workflow name `CI`), source = **GitHub Actions** specifically (not "any source" -- narrows what's allowed to satisfy the check)
- Require branches to be up to date before merging: checked
- Restrict deletions, Block force pushes: checked
- `visibility-gate`'s check won't be selectable until it has run at least once via a real PR into `main` -- add it to the required list after that first PR fires it.

**For `staging`:** same status checks, skip "Require a pull request" / approvals (this is the branch QA tests against, including things still broken).

## GitHub token scoping (see also github-token-scopes.md)

Fine-grained PAT, "Only select repositories" → the one repo. Add permissions incrementally as needed rather than granting everything upfront:
- Push a branch: **Contents: Read and write**
- Open a PR via API: also **Pull requests: Read and write**
- Push changes to `.github/workflows/*`: also **Workflows: Read and write** (separate from Contents -- pushing to this path fails without it specifically, with a clear error message naming the missing scope)

Delete the token the moment its task is done. Regenerating with an added permission is fine and doesn't require a new token value each time -- GitHub lets you edit an existing fine-grained token's permissions in place.
