#!/usr/bin/env python3
"""
PDF Inspection Script for KenPoliMarket
Inspects IEBC and KNBS PDFs to understand their structure before parsing
"""

import os
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("❌ pdfplumber not installed. Installing...")
    os.system("pip install pdfplumber")
    import pdfplumber


def inspect_pdf(pdf_path: str, max_pages: int = 3):
    """Inspect a PDF file and print its structure"""
    
    if not os.path.exists(pdf_path):
        print(f"❌ File not found: {pdf_path}")
        return
    
    print(f"\n{'='*80}")
    print(f"📄 Inspecting: {pdf_path}")
    print(f"{'='*80}\n")
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"📊 Total pages: {len(pdf.pages)}")
            print(f"📏 Page size: {pdf.pages[0].width} x {pdf.pages[0].height}")
            print()
            
            # Inspect first few pages
            for page_num in range(min(max_pages, len(pdf.pages))):
                page = pdf.pages[page_num]
                print(f"\n{'─'*80}")
                print(f"📄 Page {page_num + 1}")
                print(f"{'─'*80}\n")
                
                # Extract text
                text = page.extract_text()
                if text:
                    print("📝 Text Content (first 500 chars):")
                    print(text[:500])
                    print("..." if len(text) > 500 else "")
                else:
                    print("⚠️  No text found on this page")
                
                print()
                
                # Extract tables
                tables = page.extract_tables()
                if tables:
                    print(f"📊 Found {len(tables)} table(s) on this page\n")
                    
                    for table_idx, table in enumerate(tables):
                        print(f"Table {table_idx + 1}:")
                        print(f"  Dimensions: {len(table)} rows x {len(table[0]) if table else 0} columns")
                        print(f"  First 5 rows:")
                        
                        for row_idx, row in enumerate(table[:5]):
                            print(f"    Row {row_idx + 1}: {row}")
                        
                        if len(table) > 5:
                            print(f"    ... ({len(table) - 5} more rows)")
                        print()
                else:
                    print("⚠️  No tables found on this page\n")
                
                # Extract images
                images = page.images
                if images:
                    print(f"🖼️  Found {len(images)} image(s) on this page")
                else:
                    print("ℹ️  No images on this page")
                
                print()
    
    except Exception as e:
        print(f"❌ Error inspecting PDF: {e}")
        import traceback
        traceback.print_exc()


def main():
    """Main inspection function"""
    
    print("🇰🇪 KenPoliMarket PDF Inspection Tool")
    print("=" * 80)
    print()
    
    # Define paths to inspect
    data_dir = Path("data/raw")
    
    iebc_files = [
        data_dir / "iebc" / "2022_presidential_county.pdf",
        data_dir / "iebc" / "2022_presidential_constituency.pdf",
        data_dir / "iebc" / "2022_Presidential_Results.pdf",
    ]
    
    knbs_files = [
        data_dir / "knbs" / "2019_census_volume_1.pdf",
        data_dir / "knbs" / "2019_census_volume_4.pdf",
    ]
    
    # Inspect IEBC files
    print("\n📊 IEBC Election Results PDFs")
    print("=" * 80)
    
    found_iebc = False
    for pdf_path in iebc_files:
        if pdf_path.exists():
            inspect_pdf(str(pdf_path), max_pages=2)
            found_iebc = True
    
    if not found_iebc:
        print("\n⚠️  No IEBC PDFs found in data/raw/iebc/")
        print("Please download IEBC election results PDFs manually:")
        print("  1. Visit https://www.iebc.or.ke/")
        print("  2. Navigate to Elections → 2022 General Election → Results")
        print("  3. Download PDFs to data/raw/iebc/")
    
    # Inspect KNBS files
    print("\n\n📊 KNBS Census PDFs")
    print("=" * 80)
    
    found_knbs = False
    for pdf_path in knbs_files:
        if pdf_path.exists():
            inspect_pdf(str(pdf_path), max_pages=2)
            found_knbs = True
    
    if not found_knbs:
        print("\n⚠️  No KNBS PDFs found in data/raw/knbs/")
        print("Run the download script: bash scripts/download_data.sh")
    
    # Summary
    print("\n\n📋 Inspection Summary")
    print("=" * 80)
    print()
    
    if found_iebc or found_knbs:
        print("✅ Inspection complete!")
        print()
        print("📝 Next Steps:")
        print("1. Review the table structures above")
        print("2. Update ETL parsers in etl/scripts/ to match the actual PDF structure")
        print("3. Pay attention to:")
        print("   - Column names and positions")
        print("   - Header rows")
        print("   - Data types (numbers vs strings)")
        print("   - County/constituency name formats")
        print("4. Run ETL scripts: npm run etl:iebc && npm run etl:knbs")
    else:
        print("⚠️  No PDFs found to inspect")
        print("Please download data first: bash scripts/download_data.sh")
    
    print()


if __name__ == "__main__":
    main()

