FROM mcr.microsoft.com/devcontainers/typescript-node:latest

# Install database and messaging clients
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    postgresql-client \
    redis-tools \
    kafkacat \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install CLI utilities and editors
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    jq \
    httpie \
    tree \
    tmux \
    neovim \
    fzf \
    ripgrep \
    bat \
    lsd \
    htop \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install build tools and linters
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    make \
    build-essential \
    shellcheck \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    @anthropic-ai/claude-code \
    @nestjs/cli \
    @playwright/test \
    @prisma/client \
    @swc/cli \
    @swc/core \
    autocannon \
    clinic \
    concurrently \
    cross-env \
    dependency-cruiser \
    dotenv-cli \
    jest \
    madge \
    nodemon \
    npm-check-updates \
    pm2 \
    prisma \
    tsup \
    tsx \
    turbo \
    wait-on

# Create the notso-user manually to ensure it exists when VS Code connects
RUN groupadd --gid 1001 notso-user \
    && useradd --uid 1001 --gid notso-user --shell /bin/zsh --create-home notso-user \
    && echo "notso-user ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/notso-user \
    && chmod 0440 /etc/sudoers.d/notso-user

RUN mkdir -p /home/notso-user/.vscode-server/extensions \
    && mkdir -p /home/notso-user/.vscode-server-insiders/extensions \
    && chown -R notso-user:notso-user /home/notso-user/.vscode-server /home/notso-user/.vscode-server-insiders \
    && chmod -R 755 /home/notso-user/.vscode-server /home/notso-user/.vscode-server-insiders

# Final setup
WORKDIR /workspace
