#!/bin/bash

set -e

# Find the latest release tag from GitHub API
LATEST_TAG=$(curl -s https://api.github.com/repos/KhronosGroup/KTX-Software/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')

# Find the .deb download URL for Linux x86_64
DEB_URL=$(curl -s https://api.github.com/repos/KhronosGroup/KTX-Software/releases/latest | \
    grep -Po '"browser_download_url": "\K.*?(?=")' | grep 'Linux-x86_64.deb' | head -n 1)

if [ -z "$DEB_URL" ]; then
    echo "Could not find a .deb package for Linux x86_64 in the latest release."
    exit 1
fi

# Download the .deb package
DEB_FILE=$(basename "$DEB_URL")
echo "Downloading $DEB_FILE..."
curl -L -o "$DEB_FILE" "$DEB_URL"

# Install the .deb package
echo "Installing $DEB_FILE..."
sudo dpkg -i "$DEB_FILE" || sudo apt-get install -f -y

echo "KTX-Software installed successfully!"
ktx --help || echo "Please add the ktx binary to your PATH if needed."

rm "$DEB_FILE"
