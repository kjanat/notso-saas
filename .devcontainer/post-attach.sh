#!/bin/bash

# This script runs every time you attach to the container

# Clear the terminal
clear

# Display welcome message
echo "🚀 Welcome to SaaS Chatbot Platform Development Environment!"
echo ""
echo "📍 Quick Commands:"
echo "  pnpm dev              - Start all services"
echo "  pnpm dev:api          - Start API service only"
echo "  pnpm dev:web          - Start customer portal only"
echo "  pnpm dev:admin        - Start admin portal only"
echo "  pnpm test             - Run tests"
echo "  pnpm lint             - Lint code"
echo "  pnpm db:migrate       - Run database migrations"
echo "  pnpm db:seed          - Seed database"
echo ""
echo "🛠️  Useful Aliases:"
echo "  dc                    - docker-compose"
echo "  k                     - kubectl"
echo "  ll                    - List files (exa)"
echo "  cat                   - View files (bat)"
echo ""
echo "📚 Documentation:"
echo "  /workspace/architecture/   - Architecture documentation"
echo "  /workspace/docs/          - General documentation"
echo ""

# Set terminal title
echo -ne "\033]0;SaaS Chatbot Platform\007"

# Check if there are any pending migrations
if [ -f "prisma/schema.prisma" ]; then
    pending_migrations=$(pnpm prisma migrate status 2>/dev/null | grep -c "Database schema is not up to date" || true)
    if [ "$pending_migrations" -gt 0 ]; then
        echo "⚠️  Warning: You have pending database migrations!"
        echo "   Run 'pnpm db:migrate' to apply them."
        echo ""
    fi
fi

# Check if node_modules exists, if not suggest installing
if [ ! -d "node_modules" ]; then
    echo "📦 No node_modules found. Run 'pnpm install' to install dependencies."
    echo ""
fi

# Display current git branch and status
if [ -d ".git" ]; then
    echo "🌿 Git Status:"
    echo -n "   Branch: "
    git branch --show-current
    echo -n "   Status: "
    if [ -z "$(git status --porcelain)" ]; then
        echo "Clean"
    else
        echo "Modified files present"
    fi
    echo ""
fi

# Create a marker file to indicate successful setup
touch /workspace/.devcontainer/.setup-complete