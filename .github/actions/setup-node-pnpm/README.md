# Setup Node.js and pnpm Composite Action

This composite action sets up a consistent Node.js and pnpm environment for all CI workflows.

## What it does

1. Checks out the repository code
2. Sets up pnpm (default: latest version)
3. Sets up Node.js with pnpm caching (default: latest version)
4. Installs dependencies with `--frozen-lockfile` (optional)
5. Generates Prisma Client (optional)

## Usage

### Basic usage (with defaults)

```yaml
steps:
  - name: Setup Node.js and pnpm
    uses: ./.github/actions/setup-node-pnpm
```

### Custom versions (recommended for production)

```yaml
steps:
  - name: Setup Node.js and pnpm
    uses: ./.github/actions/setup-node-pnpm
    with:
      node-version: '22'  # Specify exact version for consistency
      pnpm-version: '10'  # Specify exact version for consistency
```

**Note:** While the defaults use `latest`, it's recommended to specify exact versions in production workflows to ensure consistency and avoid unexpected breaking changes.

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
| `node-version` | Node.js version to use | No | `latest` |
| `pnpm-version` | pnpm version to use | No | `latest` |
| `install-dependencies` | Whether to install dependencies | No | `true` |
| `generate-prisma` | Whether to generate Prisma client | No | `true` |

## Maintenance

To update default versions, edit the `action.yml` file in this directory.
All workflows using this action without explicit version inputs will automatically use the updated defaults.