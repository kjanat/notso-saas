# Setup Node.js and pnpm Composite Action

This composite action sets up a consistent Node.js and pnpm environment for all CI workflows.

## What it does

1. Checks out the repository code
2. Sets up pnpm version 10
3. Sets up Node.js version 22 with pnpm caching
4. Installs dependencies with `--frozen-lockfile`
5. Generates Prisma Client

## Usage

```yaml
steps:
  - name: Setup Node.js and pnpm
    uses: ./.github/actions/setup-node-pnpm
```

## Maintenance

To update Node.js or pnpm versions, edit the `action.yml` file in this directory.
All workflows using this action will automatically use the updated versions.