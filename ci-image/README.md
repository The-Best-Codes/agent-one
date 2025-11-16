# AgentOne Base CI Docker Image

Docker image with pre-installed dependencies for the AgentOne CI/CD pipeline.

## Prerequisites

- Docker with buildx plugin installed: https://docs.docker.com/build/install-buildx/ (pacman -S docker-buildx on Arch Linux)

## What's Included

- Ubuntu 22.04
- Node.js 23
- Rust stable toolchain
- Tauri dependencies (libwebkit2gtk-4.0-dev, libwebkit2gtk-4.1-dev, libayatana-appindicator3-dev, librsvg2-dev, patchelf, libxdo-dev, build-essential, curl, wget, file, libssl-dev)
- Playwright 1.56.1 with browsers (Chromium, Firefox, WebKit)
- Playwright system dependencies

## Building the Image

```bash
cd ci-image
./build.sh
```

### Build and Push

```bash
docker login ghcr.io
PUSH=true ./build.sh
```

### Environment Variables

- `IMAGE_NAME`: Full image name (default: `ghcr.io/the-best-codes/agent-one-base-ci`)
- `IMAGE_TAG`: Image tag (default: `latest`)
- `PLATFORM`: Target platform (default: `linux/amd64`)
- `PUSH`: Push to registry after build (default: `false`)

## Using the Image

### In GitHub Actions

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: ghcr.io/the-best-codes/agent-one-base-ci:latest
```

### Local Testing

```bash
docker run -it --rm \
  -v $(pwd):/workspace \
  -w /workspace \
  ghcr.io/the-best-codes/agent-one-base-ci:latest
```

## Updating Dependencies

1. Update the `Dockerfile`
2. Build and test locally
3. Push with a new version tag
4. Update workflow files to use the new tag

If Playwright is updated in the `package.json` of this repository, update the version in the Dockerfile and rebuild the image.
