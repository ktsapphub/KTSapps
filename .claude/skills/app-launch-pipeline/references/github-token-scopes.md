# GitHub Fine-Grained Token Scoping Cheat Sheet

Always: "Only select repositories" → the one repo the task actually needs. Never "All repositories."

| Task | Required permissions |
|---|---|
| Clone a public repo | None -- no token needed at all |
| Clone/push to a private repo, or push a branch | Contents: Read and write |
| Open a PR via the API (not just push a branch) | Contents: Read and write + Pull requests: Read and write |
| Push changes to files under `.github/workflows/` | Add Workflows: Read and write (separate from Contents -- GitHub blocks this specifically without it, with an explicit error message) |
| Just read repo metadata / check visibility | Contents: Read (or nothing extra -- the built-in `GITHUB_TOKEN` inside a workflow run can usually read its own repo's metadata without special scoping) |

Metadata: Read-only is auto-required and auto-granted by GitHub for any fine-grained token -- not something to configure.

An existing token's permissions can be edited in place (add a scope) without regenerating the token value -- useful mid-task rather than creating a second token.

Always: shortest reasonable expiration (7 days is generally plenty for a single task), delete/revoke the moment the task is done. "Delete" and "revoke" are effectively the same action for a fine-grained PAT -- there's no separate revoke button, deleting invalidates it immediately.
