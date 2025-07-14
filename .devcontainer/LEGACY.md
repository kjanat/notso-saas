# DevContainer (Legacy)

This DevContainer configuration is kept for backwards compatibility but is no longer needed with the simplified architecture.

## Why We Don't Need DevContainer Anymore

1. **Simplified Infrastructure**: Only 3 Docker containers (PostgreSQL, Redis, MinIO) instead of 11+
2. **No Docker-in-Docker**: The main application runs natively, not in a container
3. **Faster Development**: Direct file access, no container overhead
4. **Simpler Setup**: Just `docker-compose up -d` and `pnpm dev`

## If You Still Want to Use DevContainer

The configuration still works, but consider using the simplified setup instead:

```bash
# Simplified setup (recommended)
docker-compose up -d
pnpm install
pnpm dev

# Old DevContainer setup (not recommended)
# Open in VS Code and "Reopen in Container"
```

## Migration

To migrate from DevContainer to simplified setup:

1. Close VS Code
2. Delete `.devcontainer/.setup-complete` if it exists
3. Run `docker-compose down` to stop DevContainer
4. Follow the simplified setup in the main README

The simplified setup is faster, uses less memory, and is easier to debug!