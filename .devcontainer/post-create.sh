#!/bin/bash
set -e

echo "🚀 Running post-create setup..."

# Verify Go installation
echo "🔍 Verifying Go installation..."
if command -v go &>/dev/null; then
    echo "✅ Go version: $(go version)"
    echo "✅ GOPATH: $GOPATH"
    echo "✅ Go tools available"
else
    echo "❌ Go not found in PATH"
    export PATH="/usr/local/go/bin:$PATH"
    if command -v go &>/dev/null; then
        echo "✅ Go found after PATH update: $(go version)"
    else
        echo "❌ Go installation failed"
    fi
fi

# Install Go CLI tools
echo "🔧 Installing Go CLI tools..."
if command -v go &>/dev/null; then
    echo "📦 Installing yq..."
    go install github.com/mikefarah/yq/v4@latest

    echo "📦 Installing k9s..."
    go install github.com/derailed/k9s@latest

    echo "📦 Installing lazydocker..."
    go install github.com/jesseduffield/lazydocker@latest

    echo "📦 Installing dive..."
    go install github.com/wagoodman/dive@latest

    echo "✅ Go CLI tools installed successfully"
else
    echo "⚠️ Go not found, skipping CLI tools installation"
fi

# Fix ownership of user directories and prepare VS Code server directory
echo "🔧 Fixing directory ownership..."
sudo chown -R notso-user:notso-user "$HOME" /home/notso-user
sudo mkdir -p /home/notso-user/.vscode-server
sudo chown -R notso-user:notso-user /home/notso-user/.vscode-server

# Setup ZSH plugins and configuration
echo "🐚 Setting up ZSH plugins and configuration..."
mkdir -p "$HOME/.oh-my-zsh/custom/plugins"

# Install oh-my-zsh plugins
if [ ! -d "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions" ]; then
    echo "📥 Installing zsh-autosuggestions..."
    git clone https://github.com/zsh-users/zsh-autosuggestions "$HOME/.oh-my-zsh/custom/plugins/zsh-autosuggestions"
fi

if [ ! -d "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting" ]; then
    echo "📥 Installing zsh-syntax-highlighting..."
    git clone https://github.com/zsh-users/zsh-syntax-highlighting "$HOME/.oh-my-zsh/custom/plugins/zsh-syntax-highlighting"
fi

if [ ! -d "$HOME/.oh-my-zsh/custom/plugins/zsh-completions" ]; then
    echo "📥 Installing zsh-completions..."
    git clone https://github.com/zsh-users/zsh-completions "$HOME/.oh-my-zsh/custom/plugins/zsh-completions"
fi

# Configure ZSH environment and aliases
echo "⚙️ Configuring ZSH environment..."
cat >>"$HOME/.zshrc" <<'EOF'

# Custom environment variables
export PNPM_HOME="/home/notso-user/.pnpm"
export PATH="$PNPM_HOME:/usr/local/go/bin:$GOPATH/bin:$PATH"

# Custom aliases
alias ll="lsd -la"
alias cat="bat"
alias find="fd"
alias grep="rg"
alias dc="docker-compose"
alias k="kubectl"
alias kx="kubectx"
alias kn="kubens"
alias tf="terraform"

# ZSH plugins configuration
plugins=(git docker docker-compose kubectl helm npm zsh-autosuggestions zsh-syntax-highlighting zsh-completions)
EOF

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p .devcontainer/bash_history
mkdir -p .devcontainer/zsh_history
mkdir -p logs
mkdir -p data

# Touch history files
touch .devcontainer/bash_history/.bash_history
touch .devcontainer/zsh_history/.zsh_history

# Install dependencies if package.json exists
if [ -f "package.json" ]; then
    echo "📦 Installing npm dependencies with pnpm..."
    pnpm install
fi

# Install Python dependencies if requirements.txt exists
if [ -f "requirements.txt" ]; then
    echo "🐍 Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

# Setup pre-commit hooks if .pre-commit-config.yaml exists
if [ -f ".pre-commit-config.yaml" ]; then
    echo "🪝 Setting up pre-commit hooks..."
    pre-commit install
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local file..."
    cat >.env.local <<'EOF'
# Database
DATABASE_URL="postgresql://postgres:postgres@postgres:5432/platform_db"
TENANT_DATABASE_HOST="postgres"
TENANT_DATABASE_PORT="5432"

# Redis
REDIS_URL="redis://:redis_password@redis:6379"

# RabbitMQ
RABBITMQ_URL="amqp://admin:admin@rabbitmq:5672"

# MinIO (S3)
S3_ENDPOINT="http://minio:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET_AVATARS="avatars"
S3_BUCKET_UPLOADS="uploads"
S3_BUCKET_EXPORTS="exports"

# Elasticsearch
ELASTICSEARCH_URL="http://elasticsearch:9200"

# JWT
JWT_SECRET="dev-jwt-secret-change-in-production"
JWT_REFRESH_SECRET="dev-refresh-secret-change-in-production"

# API Keys (add your keys here)
OPENAI_API_KEY=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Email (using Mailhog)
SMTP_HOST="mailhog"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""

# Application
NODE_ENV="development"
PORT="3000"
CUSTOMER_PORTAL_PORT="3001"
PLATFORM_ADMIN_PORT="3002"

# Domains
API_DOMAIN="http://localhost:3000"
CUSTOMER_PORTAL_DOMAIN="http://localhost:3001"
PLATFORM_ADMIN_DOMAIN="http://localhost:3002"
WEBSOCKET_URL="ws://localhost:3008"

# Feature Flags
ENABLE_LEGACY_CSV_IMPORT="true"
ENABLE_3D_AVATARS="true"
ENABLE_ANALYTICS="true"
EOF
fi

# Create VS Code workspace settings
echo "⚙️  Creating VS Code workspace settings..."
mkdir -p .vscode
cat >.vscode/settings.json <<'EOF'
{
  "files.exclude": {
    "**/.git": true,
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/coverage": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true,
    "**/coverage": true,
    "pnpm-lock.yaml": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.workingDirectories": [
    { "mode": "auto" }
  ],
  "jest.jestCommandLine": "pnpm test",
  "jest.rootPath": "./",
  "todo-tree.regex.regex": "(//|#|<!--|;|/\\*|^|^[ \\t]*(-|\\d+.))\\s*($TAGS)",
  "todo-tree.general.tags": [
    "BUG",
    "HACK",
    "FIXME",
    "TODO",
    "XXX",
    "[ ]",
    "[x]"
  ]
}
EOF

# Create launch configuration for debugging
cat >.vscode/launch.json <<'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API Service",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "dev:api"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "*"
      }
    },
    {
      "name": "Debug Customer Portal",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "dev:web"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "openExternally"
      }
    },
    {
      "name": "Debug Jest Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "--runInBand", "--watchAll=false"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Current Test File",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "${relativeFile}", "--runInBand", "--watchAll=false"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
EOF

# Create tasks configuration
cat >.vscode/tasks.json <<'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start All Services",
      "type": "shell",
      "command": "pnpm",
      "args": ["dev"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "new"
      },
      "problemMatcher": []
    },
    {
      "label": "Run Database Migrations",
      "type": "shell",
      "command": "pnpm",
      "args": ["db:migrate"],
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Run Tests",
      "type": "shell",
      "command": "pnpm",
      "args": ["test"],
      "group": {
        "kind": "test",
        "isDefault": true
      },
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Lint Code",
      "type": "shell",
      "command": "pnpm",
      "args": ["lint"],
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      },
      "problemMatcher": ["$eslint-stylish"]
    },
    {
      "label": "Type Check",
      "type": "shell",
      "command": "pnpm",
      "args": ["type-check"],
      "presentation": {
        "reveal": "always",
        "panel": "shared"
      },
      "problemMatcher": ["$tsc"]
    }
  ]
}
EOF

# Set correct permissions
chmod 600 .devcontainer/bash_history/.bash_history
chmod 600 .devcontainer/zsh_history/.zsh_history

echo "✅ Post-create setup completed!"
