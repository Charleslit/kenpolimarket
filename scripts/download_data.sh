#!/bin/bash

# KenPoliMarket Data Download Script
# Downloads IEBC and KNBS data from official sources

set -e  # Exit on error

echo "🇰🇪 KenPoliMarket Data Download Script"
echo "========================================"
echo ""

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/raw/iebc
mkdir -p data/raw/knbs
mkdir -p data/processed
echo "✅ Directories created"
echo ""

# Function to download with retry
download_with_retry() {
    local url=$1
    local output=$2
    local max_attempts=3
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt of $max_attempts..."
        if wget -c -O "$output" "$url"; then
            echo "✅ Download successful"
            return 0
        else
            echo "❌ Download failed"
            attempt=$((attempt + 1))
            if [ $attempt -le $max_attempts ]; then
                echo "Retrying in 5 seconds..."
                sleep 5
            fi
        fi
    done

    echo "❌ Failed to download after $max_attempts attempts"
    return 1
}

# IEBC Data
echo "📊 Downloading IEBC Election Results..."
echo "----------------------------------------"
echo ""
echo "⚠️  IMPORTANT: IEBC URLs change frequently!"
echo "Please visit https://www.iebc.or.ke/ to find the latest result PDFs"
echo ""
echo "For 2022 Presidential Election:"
echo "1. Go to https://www.iebc.or.ke/"
echo "2. Navigate to: Elections → 2022 General Election → Results"
echo "3. Download the following PDFs manually to data/raw/iebc/:"
echo "   - Presidential Results (County Level)"
echo "   - Presidential Results (Constituency Level)"
echo ""
echo "Alternative: Use the results portal at https://results.iebc.or.ke/"
echo "and download the official PDF reports"
echo ""

# Placeholder for IEBC downloads (URLs need to be updated)
# Uncomment and update URLs when available
# download_with_retry \
#     "https://www.iebc.or.ke/uploads/2022_Presidential_County_Results.pdf" \
#     "data/raw/iebc/2022_presidential_county.pdf"

# download_with_retry \
#     "https://www.iebc.or.ke/uploads/2022_Presidential_Constituency_Results.pdf" \
#     "data/raw/iebc/2022_presidential_constituency.pdf"

echo "⏭️  Skipping automatic IEBC download (manual download required)"
echo ""

# KNBS Census Data
echo "📊 Downloading KNBS 2019 Census Data..."
echo "----------------------------------------"
echo ""

# Volume I: Population by County and Sub-County
echo "Downloading Volume I: Population by County and Sub-County..."
KNBS_VOL1_URL="https://www.knbs.or.ke/wp-content/uploads/2019/11/Volume-I-KPHC-2019.pdf"
if download_with_retry "$KNBS_VOL1_URL" "data/raw/knbs/2019_census_volume_1.pdf"; then
    echo "✅ Volume I downloaded"
else
    echo "⚠️  Volume I download failed. Please download manually from:"
    echo "   https://www.knbs.or.ke/"
    echo "   Navigate to: Publications → Census → 2019 Census"
fi
echo ""

# Volume IV: Distribution of Population by Socio-Economic Characteristics
echo "Downloading Volume IV: Socio-Economic Characteristics..."
KNBS_VOL4_URL="https://www.knbs.or.ke/wp-content/uploads/2023/09/2019-Kenya-population-and-Housing-Census-Volume-4-Distribution-of-Population-by-Socio-Economic-Characteristics.pdf"
if download_with_retry "$KNBS_VOL4_URL" "data/raw/knbs/2019_census_volume_4.pdf"; then
    echo "✅ Volume IV downloaded"
else
    echo "⚠️  Volume IV download failed. Please download manually from:"
    echo "   https://www.knbs.or.ke/"
    echo "   Navigate to: Publications → Census → 2019 Census"
fi
echo ""

# County boundaries (GeoJSON)
echo "📍 Downloading Kenya County Boundaries..."
echo "----------------------------------------"
echo ""

# Kenya county boundaries from various sources
# Option 1: IEBC boundaries
# Option 2: OpenAfrica
# Option 3: GitHub repositories with Kenya GIS data

echo "Downloading county boundaries (GeoJSON)..."
BOUNDARIES_URL="https://raw.githubusercontent.com/mikelmaron/kenya-election-data/master/data/counties.geojson"
if download_with_retry "$BOUNDARIES_URL" "data/raw/counties.geojson"; then
    echo "✅ County boundaries downloaded"
else
    echo "⚠️  Boundary download failed. Trying alternative source..."
    # Alternative source
    ALT_BOUNDARIES_URL="https://data.humdata.org/dataset/cod-ab-ken"
    echo "Please download manually from: $ALT_BOUNDARIES_URL"
fi
echo ""

# Summary
echo "📋 Download Summary"
echo "==================="
echo ""
echo "Data directory structure:"
tree -L 3 data/ 2>/dev/null || find data/ -type f
echo ""

echo "✅ Download script completed!"
echo ""
echo "📝 Next Steps:"
echo "1. Verify downloaded files in data/raw/"
echo "2. Manually download any missing IEBC PDFs"
echo "3. Run inspection script: python scripts/inspect_pdfs.py"
echo "4. Adjust ETL parsers based on PDF structure"
echo "5. Run ETL ingestion: npm run etl:iebc && npm run etl:knbs"
echo ""

