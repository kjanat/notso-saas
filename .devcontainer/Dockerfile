FROM mcr.microsoft.com/devcontainers/typescript-node:latest

# Install golang
RUN wget https://go.dev/dl/go1.24.5.linux-amd64.tar.gz \
    && mkdir -p /usr/local/go \
    && chown vscode:vscode /usr/local/go \
    && chmod 755 /usr/local/go \
    && tar -C /usr/local/go -xzf go1.24.5.linux-amd64.tar.gz \
    && rm go1.24.5.linux-amd64.tar.gz \
    && echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile \
    && echo 'export GOPATH=$HOME/go' >> /etc/profile

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
    python3-pip \
    python3-venv \
    shellcheck \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g \
    pnpm@latest \
    turbo@latest \
    @nestjs/cli@latest \
    prisma@latest \
    @prisma/client@latest \
    tsx@latest \
    tsup@latest \
    npm-check-updates@latest \
    concurrently@latest \
    wait-on@latest \
    cross-env@latest \
    dotenv-cli@latest \
    jest@latest \
    @playwright/test@latest \
    @swc/core@latest \
    @swc/cli@latest \
    nodemon@latest \
    pm2@latest \
    clinic@latest \
    autocannon@latest \
    madge@latest \
    dependency-cruiser@latest \
    @anthropic-ai/claude-code

# Install Python packages for AI service development
RUN pip3 install --no-cache-dir \
    fastapi \
    uvicorn \
    pydantic \
    httpx \
    redis \
    celery \
    sqlalchemy \
    alembic \
    pytest \
    black \
    flake8 \
    mypy \
    ipython

# Install useful CLI tools
RUN go install github.com/mikefarah/yq/v4@latest

# Install k9s for Kubernetes management
RUN go install github.com/derailed/k9s@latest

# Install lazydocker
RUN go install github.com/jesseduffield/lazydocker@latest

# Install dive for Docker image analysis
RUN go install github.com/wagoodman/dive@latest

# Configure pnpm
ENV PNPM_HOME="/home/vscode/.pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN mkdir -p $PNPM_HOME && chown -R vscode:vscode $PNPM_HOME

# Setup shell enhancements for vscode user
USER vscode

# Install oh-my-zsh plugins
RUN git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions \
    && git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting \
    && git clone https://github.com/zsh-users/zsh-completions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-completions

# Configure shell
RUN echo 'export PNPM_HOME="/home/vscode/.pnpm"' >> ~/.zshrc \
    && echo 'export PATH="$PNPM_HOME:$PATH"' >> ~/.zshrc \
    && echo 'alias ll="lsd -la"' >> ~/.zshrc \
    && echo 'alias cat="bat"' >> ~/.zshrc \
    && echo 'alias find="fd"' >> ~/.zshrc \
    && echo 'alias grep="rg"' >> ~/.zshrc \
    && echo 'alias dc="docker-compose"' >> ~/.zshrc \
    && echo 'alias k="kubectl"' >> ~/.zshrc \
    && echo 'alias kx="kubectx"' >> ~/.zshrc \
    && echo 'alias kn="kubens"' >> ~/.zshrc \
    && echo 'alias tf="terraform"' >> ~/.zshrc \
    && echo 'plugins=(git docker docker-compose kubectl helm npm node zsh-autosuggestions zsh-syntax-highlighting zsh-completions)' >> ~/.zshrc

# Create workspace directory
RUN mkdir -p /home/vscode/.vscode-server/extensions \
    && mkdir -p /home/vscode/.vscode-server-insiders/extensions \
    && mkdir -p /home/vscode/.pnpm-store

USER root

# Set up Git config
# Mark /workspace as a safe Git directory to avoid "detected dubious ownership" errors when using Git in dev containers.
RUN git config --global --add safe.directory /workspace

# Final setup
WORKDIR /workspace
