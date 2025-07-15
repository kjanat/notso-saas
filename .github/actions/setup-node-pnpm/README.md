# Setup Node.js and pnpm Composite Action

This composite action sets up a consistent Node.js and pnpm environment for all CI workflows.

## What it does

1. Checks out the repository code
2. Sets up pnpm (default: version 10)
3. Sets up Node.js with pnpm caching (default: version 22)
4. Installs dependencies with `--frozen-lockfile` (optional)
5. Generates Prisma Client (optional)

## Usage

### Basic usage (with defaults)

```yaml
steps:
  - name: Setup Node.js and pnpm
    uses: ./.github/actions/setup-node-pnpm
```

### Custom versions

```yaml
steps:
  - name: Setup Node.js and pnpm
    uses: ./.github/actions/setup-node-pnpm
    with:
      node-version: '20'
      pnpm-version: '9'
```

### Skip dependency installation or Prisma generation

```yaml
steps:
  - name: Setup Node.js and pnpm
    uses: ./.github/actions/setup-node-pnpm
    with:
      install-dependencies: 'false'
      generate-prisma: 'false'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `node-version` | Node.js version to use | No | `22` |
| `pnpm-version` | pnpm version to use | No | `10` |
| `install-dependencies` | Whether to install dependencies | No | `true` |
| `generate-prisma` | Whether to generate Prisma client | No | `true` |

## Maintenance

To update default versions, edit the `action.yml` file in this directory.
All workflows using this action without explicit version inputs will automatically use the updated defaults.