# Explorer Page - Quick Checklist

## ✅ What's Already Done

- [x] Fixed API URL mismatch (`.env.local` updated)
- [x] Created Leaflet-based interactive map component
- [x] Integrated GeoJSON support for boundaries
- [x] Added automatic centroid calculation
- [x] Implemented fallback for missing GeoJSON files
- [x] Updated CountyExplorerEnhanced to use new map
- [x] Created download script for GeoJSON files
- [x] Added comprehensive documentation

## 🔧 What You Need to Do

### Priority 1: Get Explorer Working (5 minutes)

- [ ] **Start PostgreSQL Database**
  ```bash
  sudo systemctl start postgresql
  # Or check your database setup
  ```

- [ ] **Verify Backend is Running**
  ```bash
  cd backend
  source venv/bin/activate
  uvicorn main:app --reload --port 8001
  ```

- [ ] **Verify Frontend is Running**
  ```bash
  cd frontend
  npm run dev
  ```

- [ ] **Test Explorer Page**
  - Open http://localhost:3000/explorer
  - Should see map with counties
  - Click a county to drill down

### Priority 2: Add Accurate Coordinates (10 minutes)

- [ ] **Download GeoJSON Files**
  ```bash
  ./scripts/download_geojson.sh
  # Choose option 1
  ```

- [ ] **Verify Files Downloaded**
  ```bash
  ls -lh frontend/public/*.geojson
  ```
  Should see:
  - `kenya-counties.geojson` (already exists)
  - `kenya-constituencies.geojson` (new)
  - `kenya-wards.geojson` (new)

- [ ] **Restart Frontend**
  ```bash
  # Ctrl+C in frontend terminal
  npm run dev
  ```

- [ ] **Test Improved Accuracy**
  - Visit http://localhost:3000/explorer
  - Click through counties → constituencies → wards
  - Markers should now be at accurate locations

### Priority 3: Optional Enhancements

- [ ] **Add Polling Station Coordinates**
  - Update database with lat/lng for polling stations
  - Or import from IEBC data

- [ ] **Customize Map Appearance**
  - Edit `LeafletInteractiveMap.tsx`
  - Change marker colors, sizes, or tile provider

- [ ] **Optimize Large GeoJSON Files**
  ```bash
  npm install -g mapshaper
  mapshaper kenya-wards.geojson -simplify 10% -o kenya-wards-simple.geojson
  ```

## 🐛 Troubleshooting Checklist

### Map Not Showing?

- [ ] Check browser console for errors (F12)
- [ ] Verify API is accessible: http://localhost:8001/api/counties/
- [ ] Check database is running: `sudo systemctl status postgresql`
- [ ] Verify `.env.local` has correct API URL

### Database Connection Errors?

- [ ] PostgreSQL is running
- [ ] Check `backend/config.py` for correct database settings
- [ ] Verify port 5433 (or your configured port)
- [ ] Check database credentials

### GeoJSON Not Loading?

- [ ] Files are in `frontend/public/` directory
- [ ] Files are valid JSON (test with `jq`)
- [ ] File names match exactly:
  - `kenya-counties.geojson`
  - `kenya-constituencies.geojson`
  - `kenya-wards.geojson`

### Markers in Wrong Locations?

- [ ] GeoJSON files are present
- [ ] Property names match (check `GEOJSON_README.md`)
- [ ] Centroid calculation is working (check console)

## 📊 Quick Tests

### Test 1: API Connectivity
```bash
curl http://localhost:8001/api/counties/ | jq
```
Should return JSON array of counties.

### Test 2: GeoJSON Files
```bash
cat frontend/public/kenya-counties.geojson | jq '.features | length'
```
Should return 47 (number of counties).

### Test 3: Frontend Build
```bash
cd frontend
npm run build
```
Should build without errors.

### Test 4: Map Loading
1. Open http://localhost:3000/explorer
2. Open browser console (F12)
3. Should see no errors
4. Should see map tiles loading

## 📁 Files to Review

### Created Files
- [ ] `frontend/components/explorer/LeafletInteractiveMap.tsx`
- [ ] `frontend/public/GEOJSON_README.md`
- [ ] `scripts/download_geojson.sh`
- [ ] `EXPLORER_MAP_SETUP.md`
- [ ] `EXPLORER_SUMMARY.md`
- [ ] `EXPLORER_CHECKLIST.md` (this file)

### Modified Files
- [ ] `frontend/.env.local` (API URL updated)
- [ ] `frontend/components/explorer/CountyExplorerEnhanced.tsx` (uses new map)

## 🎯 Success Criteria

### Minimum (Explorer Works)
- [x] API URL fixed
- [x] Leaflet map component created
- [ ] Database running
- [ ] Can view counties on map
- [ ] Can drill down to constituencies and wards

### Optimal (Accurate Coordinates)
- [ ] GeoJSON files downloaded
- [ ] Counties show accurate boundaries
- [ ] Constituencies show accurate locations
- [ ] Wards show accurate locations
- [ ] Polling stations have coordinates (if in database)

### Excellent (Full Features)
- [ ] All GeoJSON files optimized for size
- [ ] Custom map styling applied
- [ ] Polling station coordinates added
- [ ] Performance optimized
- [ ] Mobile tested

## 📝 Quick Commands Reference

```bash
# Start database
sudo systemctl start postgresql

# Start backend
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8001

# Start frontend
cd frontend && npm run dev

# Download GeoJSON
./scripts/download_geojson.sh

# Check files
ls -lh frontend/public/*.geojson

# Test API
curl http://localhost:8001/api/counties/ | jq

# Validate GeoJSON
cat frontend/public/kenya-counties.geojson | jq .

# Simplify GeoJSON
mapshaper input.geojson -simplify 10% -o output.geojson
```

## 🚀 Next Steps After Checklist

1. **Test thoroughly** - Click through all levels
2. **Check mobile** - Test on phone/tablet
3. **Monitor performance** - Check load times
4. **Add features** - Search, filters, etc.
5. **Deploy** - Push to production when ready

## 📞 Need Help?

Check these files:
- `EXPLORER_SUMMARY.md` - Complete overview
- `EXPLORER_MAP_SETUP.md` - Detailed setup guide
- `frontend/public/GEOJSON_README.md` - GeoJSON help

## ✅ Final Check

Before considering this complete:

- [ ] Explorer page loads without errors
- [ ] Can see counties on map
- [ ] Can click and drill down
- [ ] Map is interactive (pan/zoom works)
- [ ] Data loads from API
- [ ] GeoJSON files present (or fallback working)
- [ ] Documentation reviewed
- [ ] Ready to add more features

---

**Current Status:** 
- ✅ Code complete
- ⏳ Database setup needed
- ⏳ GeoJSON download recommended
- ⏳ Testing required

