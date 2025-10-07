#!/bin/bash

# Script to download Kenya GeoJSON files for administrative boundaries
# This script helps you get GeoJSON files for counties, constituencies, and wards

set -e

FRONTEND_PUBLIC_DIR="frontend/public"
TEMP_DIR="/tmp/kenya_geojson"

echo "🗺️  Kenya GeoJSON Downloader"
echo "=============================="
echo ""

# Create temp directory
mkdir -p "$TEMP_DIR"

# Function to download from GADM
download_from_gadm() {
    echo "📥 Downloading from GADM (Global Administrative Areas)..."
    echo ""
    
    # GADM provides administrative boundaries for all countries
    # Level 0 = Country
    # Level 1 = Counties (47)
    # Level 2 = Constituencies (290)
    # Level 3 = Wards (1450+)
    
    GADM_URL="https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_KEN"
    
    echo "Downloading Kenya Level 1 (Counties)..."
    curl -L "${GADM_URL}_1.json" -o "$TEMP_DIR/kenya-counties-gadm.json" || {
        echo "❌ Failed to download counties from GADM"
        return 1
    }
    
    echo "Downloading Kenya Level 2 (Constituencies)..."
    curl -L "${GADM_URL}_2.json" -o "$TEMP_DIR/kenya-constituencies-gadm.json" || {
        echo "⚠️  Failed to download constituencies from GADM"
    }
    
    echo "Downloading Kenya Level 3 (Wards)..."
    curl -L "${GADM_URL}_3.json" -o "$TEMP_DIR/kenya-wards-gadm.json" || {
        echo "⚠️  Failed to download wards from GADM"
    }
    
    echo "✅ Download complete!"
}

# Function to simplify GeoJSON (requires mapshaper)
simplify_geojson() {
    local input_file=$1
    local output_file=$2
    local percentage=${3:-10}
    
    if command -v mapshaper &> /dev/null; then
        echo "🔧 Simplifying $input_file..."
        mapshaper "$input_file" -simplify "${percentage}%" -o "$output_file"
    else
        echo "⚠️  mapshaper not installed. Skipping simplification."
        echo "   Install with: npm install -g mapshaper"
        cp "$input_file" "$output_file"
    fi
}

# Function to process and copy files
process_files() {
    echo ""
    echo "📦 Processing files..."
    echo ""
    
    # Process counties
    if [ -f "$TEMP_DIR/kenya-counties-gadm.json" ]; then
        echo "Processing counties..."
        simplify_geojson \
            "$TEMP_DIR/kenya-counties-gadm.json" \
            "$FRONTEND_PUBLIC_DIR/kenya-counties.geojson" \
            15
        echo "✅ Counties GeoJSON ready"
    fi
    
    # Process constituencies
    if [ -f "$TEMP_DIR/kenya-constituencies-gadm.json" ]; then
        echo "Processing constituencies..."
        simplify_geojson \
            "$TEMP_DIR/kenya-constituencies-gadm.json" \
            "$FRONTEND_PUBLIC_DIR/kenya-constituencies.geojson" \
            10
        echo "✅ Constituencies GeoJSON ready"
    fi
    
    # Process wards
    if [ -f "$TEMP_DIR/kenya-wards-gadm.json" ]; then
        echo "Processing wards..."
        simplify_geojson \
            "$TEMP_DIR/kenya-wards-gadm.json" \
            "$FRONTEND_PUBLIC_DIR/kenya-wards.geojson" \
            5
        echo "✅ Wards GeoJSON ready"
    fi
}

# Function to show file sizes
show_file_info() {
    echo ""
    echo "📊 File Information:"
    echo "===================="
    
    for file in "$FRONTEND_PUBLIC_DIR"/kenya-*.geojson; do
        if [ -f "$file" ]; then
            size=$(du -h "$file" | cut -f1)
            features=$(jq '.features | length' "$file" 2>/dev/null || echo "unknown")
            echo "$(basename "$file"): $size ($features features)"
        fi
    done
}

# Main execution
main() {
    echo "This script will download GeoJSON files for Kenya's administrative boundaries."
    echo ""
    echo "Options:"
    echo "1. Download from GADM (recommended - free, no API key needed)"
    echo "2. Skip download (use existing files)"
    echo "3. Exit"
    echo ""
    read -p "Choose an option (1-3): " choice
    
    case $choice in
        1)
            download_from_gadm
            process_files
            show_file_info
            ;;
        2)
            echo "Skipping download..."
            process_files
            show_file_info
            ;;
        3)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Exiting..."
            exit 1
            ;;
    esac
    
    echo ""
    echo "✅ Done!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Check the files in $FRONTEND_PUBLIC_DIR"
    echo "2. Restart your Next.js dev server"
    echo "3. Navigate to /explorer to see the map"
    echo ""
    echo "💡 Tip: If files are too large, install mapshaper to simplify them:"
    echo "   npm install -g mapshaper"
}

# Run main function
main

