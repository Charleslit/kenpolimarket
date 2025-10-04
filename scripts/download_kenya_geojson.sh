#!/bin/bash

# Script to download Kenya county GeoJSON boundaries
# This script tries multiple sources to ensure you get the data

set -e

echo "🗺️  Kenya County GeoJSON Downloader"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Create directories
mkdir -p frontend/public
mkdir -p data/geojson

# Function to download with retry
download_with_retry() {
    local url=$1
    local output=$2
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt of $max_attempts..."
        if curl -L -f -o "$output" "$url" 2>/dev/null; then
            return 0
        fi
        attempt=$((attempt + 1))
        sleep 2
    done
    return 1
}

# Function to validate GeoJSON
validate_geojson() {
    local file=$1
    
    # Check if file exists and is not empty
    if [ ! -s "$file" ]; then
        return 1
    fi
    
    # Check if it's valid JSON
    if ! python3 -c "import json; json.load(open('$file'))" 2>/dev/null; then
        return 1
    fi
    
    # Check if it has features
    if ! grep -q '"features"' "$file"; then
        return 1
    fi
    
    return 0
}

echo "📥 Downloading Kenya County Boundaries..."
echo ""

# Source 1: mikelmaron/kenya-election-data (GitHub)
echo "Source 1: GitHub - mikelmaron/kenya-election-data"
echo "------------------------------------------------"
URL1="https://raw.githubusercontent.com/mikelmaron/kenya-election-data/master/data/counties.geojson"
if download_with_retry "$URL1" "data/geojson/kenya-counties-source1.geojson"; then
    if validate_geojson "data/geojson/kenya-counties-source1.geojson"; then
        echo -e "${GREEN}✅ Successfully downloaded from Source 1${NC}"
        cp data/geojson/kenya-counties-source1.geojson frontend/public/kenya-counties.geojson
        SUCCESS=true
    else
        echo -e "${RED}❌ Downloaded file is invalid${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Source 1 failed${NC}"
fi
echo ""

# If first source failed, try alternative sources
if [ -z "$SUCCESS" ]; then
    echo "Source 2: Humanitarian Data Exchange (HDX)"
    echo "-------------------------------------------"
    echo "HDX requires manual download. Please visit:"
    echo "https://data.humdata.org/dataset/cod-ab-ken"
    echo ""
    echo "Steps:"
    echo "1. Click 'Download' on the page"
    echo "2. Select 'GeoJSON' format for Admin Level 1 (Counties)"
    echo "3. Save to: frontend/public/kenya-counties.geojson"
    echo ""
fi

# Source 3: geoBoundaries
if [ -z "$SUCCESS" ]; then
    echo "Source 3: geoBoundaries"
    echo "-----------------------"
    URL3="https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/KEN/ADM1/geoBoundaries-KEN-ADM1.geojson"
    if download_with_retry "$URL3" "data/geojson/kenya-counties-source3.geojson"; then
        if validate_geojson "data/geojson/kenya-counties-source3.geojson"; then
            echo -e "${GREEN}✅ Successfully downloaded from Source 3${NC}"
            cp data/geojson/kenya-counties-source3.geojson frontend/public/kenya-counties.geojson
            SUCCESS=true
        else
            echo -e "${RED}❌ Downloaded file is invalid${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Source 3 failed${NC}"
    fi
    echo ""
fi

# Check if we got the file
if [ -f "frontend/public/kenya-counties.geojson" ]; then
    echo -e "${GREEN}✅ SUCCESS!${NC}"
    echo ""
    echo "GeoJSON file saved to: frontend/public/kenya-counties.geojson"
    
    # Get file info
    FILE_SIZE=$(du -h frontend/public/kenya-counties.geojson | cut -f1)
    FEATURE_COUNT=$(grep -o '"type"[[:space:]]*:[[:space:]]*"Feature"' frontend/public/kenya-counties.geojson | wc -l)
    
    echo ""
    echo "📊 File Information:"
    echo "  - Size: $FILE_SIZE"
    echo "  - Features: $FEATURE_COUNT"
    echo ""
    
    # Show sample properties
    echo "📋 Sample County Properties:"
    python3 << 'EOF'
import json
try:
    with open('frontend/public/kenya-counties.geojson', 'r') as f:
        data = json.load(f)
        if data.get('features'):
            props = data['features'][0].get('properties', {})
            print("  Available properties:")
            for key in props.keys():
                print(f"    - {key}: {props[key]}")
except Exception as e:
    print(f"  Error reading file: {e}")
EOF
    
    echo ""
    echo -e "${GREEN}🎉 Setup Complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Install Leaflet: cd frontend && npm install leaflet react-leaflet"
    echo "2. Update your page to use LeafletCountyMap component"
    echo "3. See PRODUCTION_MAP_SETUP.md for detailed instructions"
    
else
    echo -e "${RED}❌ FAILED${NC}"
    echo ""
    echo "Could not download GeoJSON automatically."
    echo ""
    echo "Please download manually from one of these sources:"
    echo ""
    echo "1. Humanitarian Data Exchange (Recommended):"
    echo "   https://data.humdata.org/dataset/cod-ab-ken"
    echo ""
    echo "2. geoBoundaries:"
    echo "   https://www.geoboundaries.org/"
    echo "   Search for 'Kenya' and download ADM1 (County level)"
    echo ""
    echo "3. IEBC Official (Most accurate for elections):"
    echo "   Contact IEBC for official electoral boundaries"
    echo ""
    echo "Save the downloaded file to:"
    echo "  frontend/public/kenya-counties.geojson"
    echo ""
    exit 1
fi

# Optional: Simplify GeoJSON if mapshaper is installed
if command -v mapshaper &> /dev/null; then
    echo ""
    echo "🔧 Simplifying GeoJSON for better performance..."
    mapshaper frontend/public/kenya-counties.geojson \
        -simplify 20% \
        -o frontend/public/kenya-counties-simplified.geojson
    
    if [ -f "frontend/public/kenya-counties-simplified.geojson" ]; then
        ORIG_SIZE=$(du -h frontend/public/kenya-counties.geojson | cut -f1)
        SIMP_SIZE=$(du -h frontend/public/kenya-counties-simplified.geojson | cut -f1)
        echo -e "${GREEN}✅ Simplified version created${NC}"
        echo "  Original: $ORIG_SIZE"
        echo "  Simplified: $SIMP_SIZE"
        echo ""
        echo "To use simplified version, rename it:"
        echo "  mv frontend/public/kenya-counties-simplified.geojson frontend/public/kenya-counties.geojson"
    fi
else
    echo ""
    echo "💡 Tip: Install mapshaper to simplify GeoJSON for better performance:"
    echo "  npm install -g mapshaper"
fi

echo ""
echo "Done! 🎉"

