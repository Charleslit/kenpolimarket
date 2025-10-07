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

# Function to download from alternative sources
download_from_alternative() {
    echo "📥 Downloading from alternative sources..."
    echo ""

    # Try HDX (Humanitarian Data Exchange)
    echo "Trying Humanitarian Data Exchange..."

    # Kenya counties from HDX
    curl -L "https://data.humdata.org/dataset/0c2a65c7-2f6d-4e58-b691-b4c4f0b5d0b8/resource/counties.geojson" \
        -o "$TEMP_DIR/kenya-counties-hdx.json" 2>/dev/null || {
        echo "⚠️  HDX source not available"
    }

    # If HDX fails, try using existing county file as template
    if [ ! -f "$TEMP_DIR/kenya-counties-hdx.json" ]; then
        echo "Using existing county file..."
        if [ -f "$FRONTEND_PUBLIC_DIR/kenya-counties.geojson" ]; then
            cp "$FRONTEND_PUBLIC_DIR/kenya-counties.geojson" "$TEMP_DIR/kenya-counties-gadm.json"
            echo "✅ Using existing counties file"
        fi
    else
        mv "$TEMP_DIR/kenya-counties-hdx.json" "$TEMP_DIR/kenya-counties-gadm.json"
        echo "✅ Downloaded counties from HDX"
    fi

    echo ""
    echo "⚠️  Note: Constituencies and wards GeoJSON files are not available from free sources."
    echo "   You have two options:"
    echo "   1. Use centroids-only (lightweight, fast loading)"
    echo "   2. Obtain official shapefiles from IEBC and convert them"
    echo ""
}

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
    curl -L --connect-timeout 10 "${GADM_URL}_1.json" -o "$TEMP_DIR/kenya-counties-gadm.json" || {
        echo "❌ Failed to download counties from GADM"
        echo "Trying alternative sources..."
        download_from_alternative
        return 1
    }

    echo "Downloading Kenya Level 2 (Constituencies)..."
    curl -L --connect-timeout 10 "${GADM_URL}_2.json" -o "$TEMP_DIR/kenya-constituencies-gadm.json" || {
        echo "⚠️  Failed to download constituencies from GADM"
    }

    echo "Downloading Kenya Level 3 (Wards)..."
    curl -L --connect-timeout 10 "${GADM_URL}_3.json" -o "$TEMP_DIR/kenya-wards-gadm.json" || {
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

# Function to create centroids-only file (much smaller, faster loading)
create_centroids_file() {
    local input_file=$1
    local output_file=$2
    local name=$3

    echo "Creating centroids-only file for $name..."

    if [ ! -f "$input_file" ]; then
        echo "⚠️  Input file not found: $input_file"
        return 1
    fi

    if command -v jq &> /dev/null; then
        # Extract centroids using jq
        jq '{
            type: "FeatureCollection",
            features: [.features[] | {
                type: "Feature",
                properties: .properties,
                geometry: {
                    type: "Point",
                    coordinates: (
                        if .geometry.type == "Polygon" then
                            (.geometry.coordinates[0] |
                             (reduce .[] as $coord ([0,0,0];
                                [.[0] + $coord[0], .[1] + $coord[1], .[2] + 1])) |
                             [.[0]/.[2], .[1]/.[2]])
                        elif .geometry.type == "MultiPolygon" then
                            (.geometry.coordinates[0][0] |
                             (reduce .[] as $coord ([0,0,0];
                                [.[0] + $coord[0], .[1] + $coord[1], .[2] + 1])) |
                             [.[0]/.[2], .[1]/.[2]])
                        else
                            .geometry.coordinates
                        end
                    )
                }
            }]
        }' "$input_file" > "$output_file"

        echo "✅ Created centroids file: $(basename "$output_file")"
    else
        echo "⚠️  jq not installed. Cannot create centroids file."
        echo "   Install with: sudo apt install jq"
        cp "$input_file" "$output_file"
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
    echo "⚠️  Note: Full boundary GeoJSON files are very large and may not be freely available."
    echo "   For faster loading, we recommend using centroids-only files."
    echo ""
    echo "Options:"
    echo "1. Download from GADM (full boundaries - may fail)"
    echo "2. Create centroids-only files (recommended - fast & lightweight)"
    echo "3. Skip download (use existing files)"
    echo "4. Exit"
    echo ""
    read -p "Choose an option (1-4): " choice

    case $choice in
        1)
            download_from_gadm
            process_files
            show_file_info
            ;;
        2)
            echo ""
            echo "📍 Creating centroids-only files..."
            echo "This creates lightweight files with just center points (not full boundaries)"
            echo ""

            # Check if we have the county file to use as reference
            if [ -f "$FRONTEND_PUBLIC_DIR/kenya-counties.geojson" ]; then
                echo "✅ Using existing counties file"

                # For constituencies and wards, we'll create placeholder files
                # These will be populated from the database
                echo ""
                echo "Creating placeholder files for constituencies and wards..."
                echo "These will be populated with data from your database."
                echo ""

                # Create empty GeoJSON structure
                cat > "$FRONTEND_PUBLIC_DIR/kenya-constituencies-centroids.geojson" << 'EOF'
{
  "type": "FeatureCollection",
  "features": []
}
EOF

                cat > "$FRONTEND_PUBLIC_DIR/kenya-wards-centroids.geojson" << 'EOF'
{
  "type": "FeatureCollection",
  "features": []
}
EOF

                echo "✅ Created placeholder files"
                echo ""
                echo "📝 To populate these files with real data:"
                echo "   1. Export constituency/ward data from your database"
                echo "   2. Use a geocoding service to get coordinates"
                echo "   3. Or obtain official data from IEBC"

            else
                echo "❌ No counties file found. Please ensure kenya-counties.geojson exists."
                exit 1
            fi

            show_file_info
            ;;
        3)
            echo "Skipping download..."
            process_files
            show_file_info
            ;;
        4)
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
    echo "💡 Tips:"
    echo "   - The map will work with approximate locations for now"
    echo "   - Add real coordinates to the placeholder files as you get them"
    echo "   - For full boundaries, obtain shapefiles from IEBC and convert to GeoJSON"
}

# Run main function
main

