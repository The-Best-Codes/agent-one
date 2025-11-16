FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    file \
    libssl-dev \
    pkg-config \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_23.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list

RUN apt-get update && apt-get install -y nodejs && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install -y \
    libwebkit2gtk-4.0-dev \
    libwebkit2gtk-4.1-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    libxdo-dev \
    && rm -rf /var/lib/apt/lists/*

RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal

ENV PATH="/root/.cargo/bin:${PATH}"

# If playwright is updated in /package.json, update the version here too
RUN npx --yes playwright@1.56.1 install --with-deps

RUN mkdir -p /root/.cache/ms-playwright && \
    mkdir -p /root/.cargo/registry && \
    mkdir -p /root/.cargo/git

RUN node --version && \
    npm --version && \
    rustc --version && \
    cargo --version

WORKDIR /workspace

CMD ["/bin/bash"]
