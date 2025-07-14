#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MODELS_DIR="$PROJECT_ROOT/models"

# Base URLs
BASE_URL="https://proto.notso.ai/"
URLS=(
    "mascots/"
    "buffers/"
    "textures/"
)

# Parse command line arguments
UPDATE_PATHS=true
while [[ $# -gt 0 ]]; do
    case $1 in
        --no-update-paths)
            UPDATE_PATHS=false
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo "Options:"
            echo "  --no-update-paths    Don't update GLTF files to use local paths"
            echo "  -h, --help          Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h for help"
            exit 1
            ;;
    esac
done

# Create models directory if it doesn't exist
mkdir -p "$MODELS_DIR"

# Add download date to main sources.txt
echo "# Download date: $(date '+%Y-%m-%d %H:%M:%S')" > "$MODELS_DIR/sources.txt"

# Function to download files from a directory
download_directory() {
    local dir_url="$1"
    local subdir="${dir_url%/}"  # Remove trailing slash
    
    echo ""
    echo "========================================="
    echo "Fetching $subdir list..."
    echo "========================================="
    
    # Create subdirectory
    mkdir -p "$MODELS_DIR/$subdir"
    
    # Create sources.txt for this subdirectory
    echo "# Download date: $(date '+%Y-%m-%d %H:%M:%S')" > "$MODELS_DIR/$subdir/sources.txt"
    
    # Get the directory listing and extract links
    curl -s "${BASE_URL}${dir_url}" | \
    grep -oP '(?<=href=")[^"]*(?=")' | \
    grep -v '^http' | \
    grep -v '../' | \
    while read -r file; do
        # Skip empty lines
        if [ -n "$file" ]; then
            full_url="${BASE_URL}${dir_url}${file}"
            
            # Add to both main and subdirectory sources.txt
            echo "$full_url" | tee -a "$MODELS_DIR/sources.txt" -a "$MODELS_DIR/$subdir/sources.txt"
            
            # Download the file
            echo "Downloading $file..."
            curl -s -o "$MODELS_DIR/$subdir/$file" "$full_url"
        fi
    done
}

# Download from each directory
for url in "${URLS[@]}"; do
    download_directory "$url"
done

echo ""
echo "========================================="
echo "Download complete!"
echo "Files saved in:"
for url in "${URLS[@]}"; do
    echo "  - $MODELS_DIR/${url%/}/"
done
echo "Source URLs saved in $MODELS_DIR/sources.txt"
echo "========================================="

# Function to update GLTF files with local paths
update_gltf_paths() {
    echo ""
    echo "========================================="
    echo "Updating GLTF files to use local paths..."
    echo "========================================="
    
    local updated_count=0
    
    # Process each GLTF file in mascots directory
    for gltf_file in "$MODELS_DIR/mascots"/*.gltf; do
        [ -f "$gltf_file" ] || continue
        
        local filename=$(basename "$gltf_file")
        echo "Processing: $filename"
        
        # Create a temporary file for the updated content
        local temp_file="${gltf_file}.tmp"
        
        # Use jq to update the URIs
        jq '
            # Update buffer URIs
            if .buffers then
                .buffers |= map(
                    if .uri then
                        if (.uri | startswith("https://proto.notso.ai/buffers/")) then
                            .uri = "../buffers/" + (.uri | split("/")[-1])
                        elif (.uri | startswith("https://proto.notso.ai/")) then
                            .uri = "../buffers/" + (.uri | split("/")[-1])
                        elif (.uri | contains("/") | not) then
                            # Check if file exists in buffers directory
                            .uri = "../buffers/" + .uri
                        else
                            .
                        end
                    else . end
                )
            else . end |
            
            # Update image URIs
            if .images then
                .images |= map(
                    if .uri then
                        if (.uri | startswith("https://proto.notso.ai/textures/")) then
                            .uri = "../textures/" + (.uri | split("/")[-1])
                        elif (.uri | startswith("textures/")) then
                            .uri = "../" + .uri
                        elif (.uri | startswith("https://proto.notso.ai/")) then
                            .uri = "../textures/" + (.uri | split("/")[-1])
                        else
                            .
                        end
                    else . end
                )
            else . end
        ' "$gltf_file" > "$temp_file"
        
        # Check if jq succeeded and file is valid
        if [ $? -eq 0 ] && [ -s "$temp_file" ]; then
            mv "$temp_file" "$gltf_file"
            ((updated_count++))
            echo "  ✓ Updated $filename"
        else
            rm -f "$temp_file"
            echo "  ✗ Failed to update $filename"
        fi
    done
    
    echo ""
    echo "Updated $updated_count GLTF files to use local paths"
}

# Update GLTF paths if not disabled
if [ "$UPDATE_PATHS" = true ]; then
    update_gltf_paths
else
    echo ""
    echo "Skipping GLTF path updates (--no-update-paths specified)"
fi