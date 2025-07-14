#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status.

# Get the absolute path of the project root
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)
MODELS_DIR="$PROJECT_ROOT/models"
OUTPUT_DIR="$PROJECT_ROOT/models/outputs"
GLTF_TRANSFORM_BIN="$PROJECT_ROOT/gltf-tools/node_modules/.bin/gltf-transform"

# Ensure the output directory exists
mkdir -p "$OUTPUT_DIR"

# Find all .gltf files in the models directory
find "$MODELS_DIR" -name '*.gltf' -print0 | while IFS= read -r -d $'\0' gltf_file; do
  if [ -f "$gltf_file" ]; then
    filename=$(basename "$gltf_file" .gltf)
    input_path="$gltf_file"
    output_path="$OUTPUT_DIR/$filename.glb"

    echo "Processing $filename..."

    # Run the gltf-transform pipeline
    "$GLTF_TRANSFORM_BIN" "$input_path" "$output_path" \
      prune \
      weld \
      resize --width 1024 --height 1024 \
      uastc --level 2 --rdo-lambda 4 --rdo-dictionary-size 32768 --zstd 18 \
      draco

    echo "✅  Optimized and saved to $output_path"
    echo "--------------------------------"
  fi
done

echo "All models processed!"