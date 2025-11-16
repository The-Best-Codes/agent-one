FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    PATH="/root/.cargo/bin:${PATH}" \
    CARGO_HOME=/root/.cargo \
    RUSTUP_HOME=/root/.rustup

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    build-essential \
    file \
    libssl-dev \
    pkg-config \
    ca-certificates \
    gnupg \
    libwebkit2gtk-4.0-dev \
    libwebkit2gtk-4.1-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    patchelf \
    libxdo-dev \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal \
    && . $CARGO_HOME/env \
    && npx --yes playwright@1.56.1 install --with-deps \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    /var/cache/apt/archives/* \
    /tmp/* \
    /var/tmp/* \
    /usr/share/doc/* \
    /usr/share/man/* \
    /usr/share/locale/* \
    /root/.npm \
    && [ -d /root/.cargo/registry ] && find /root/.cargo/registry -type f \( -name '*.a' -o -name '*.rlib' \) -delete || true \
    && mkdir -p /root/.cache/ms-playwright \
    /root/.cargo/registry \
    /root/.cargo/git \
    && node --version \
    && npm --version \
    && rustc --version \
    && cargo --version

WORKDIR /workspace

CMD ["/bin/bash"]
