FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye

# Install additional OS packages
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        postgresql-client \
        redis-tools \
        kafkacat \
        jq \
        httpie \
        tree \
        tmux \
        neovim \
        fzf \
        ripgrep \
        bat \
        exa \
        htop \
        make \
        build-essential \
        python3-pip \
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
    dependency-cruiser@latest

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
RUN curl -fsSL https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -o /usr/local/bin/yq \
    && chmod +x /usr/local/bin/yq

RUN curl -fsSL https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 -o /usr/local/bin/jq \
    && chmod +x /usr/local/bin/jq

# Install k9s for Kubernetes management
RUN curl -fsSL https://github.com/derailed/k9s/releases/latest/download/k9s_Linux_amd64.tar.gz | tar -xz -C /usr/local/bin

# Install lazydocker
RUN curl -fsSL https://github.com/jesseduffield/lazydocker/releases/latest/download/lazydocker_0.23.1_Linux_x86_64.tar.gz | tar -xz -C /usr/local/bin

# Install dive for Docker image analysis
RUN curl -fsSL https://github.com/wagoodman/dive/releases/latest/download/dive_0.11.0_linux_amd64.tar.gz | tar -xz -C /usr/local/bin

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
    && echo 'alias ll="exa -la"' >> ~/.zshrc \
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
RUN git config --global --add safe.directory /workspace

# Final setup
WORKDIR /workspace