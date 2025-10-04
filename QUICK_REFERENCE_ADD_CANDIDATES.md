# 🗳️ Quick Reference: Adding New Candidates

## ⚡ **30-Second Quick Start**

```bash
# 1. Edit candidate list
nano models/multi_candidate_forecast.py  # Line ~200

# 2. Generate forecasts
cd models && source ../backend/venv/bin/activate
python multi_candidate_forecast.py --samples 2000

# 3. Store in database
python store_forecasts_multi.py

# 4. Verify
curl http://localhost:8001/api/forecasts/summary/national | jq '.candidates'

# 5. View in browser
# http://localhost:3000/forecasts → Select county → Click "🔮 2027 Forecast"
```

---

## 📝 **Candidate List Template**

Copy this into `models/multi_candidate_forecast.py` (line ~200):

```python
candidates = [
    # Incumbent/Major Candidates
    {'name': 'William Ruto', 'party': 'UDA'},
    {'name': 'Raila Odinga', 'party': 'Azimio'},
    
    # Opposition Candidates
    {'name': 'Kalonzo Musyoka', 'party': 'Wiper'},
    {'name': 'Musalia Mudavadi', 'party': 'ANC'},
    
    # New/Minor Candidates
    {'name': 'Martha Karua', 'party': 'NARC-Kenya'},
    {'name': 'George Wajackoyah', 'party': 'Roots Party'},
    
    # Add more here...
]
```

---

## 🔍 **Verification Commands**

```bash
# Check candidates in database
psql -h localhost -p 5433 -U kenpolimarket_user -d kenpolimarket \
  -c "SELECT id, name, party FROM candidates ORDER BY id DESC LIMIT 10;"

# Check forecast count
psql -h localhost -p 5433 -U kenpolimarket_user -d kenpolimarket \
  -c "SELECT COUNT(*) FROM forecast_county WHERE forecast_run_id = (SELECT id FROM forecast_runs ORDER BY run_timestamp DESC LIMIT 1);"

# Test API - National Summary
curl -s http://localhost:8001/api/forecasts/summary/national | jq '.candidates[] | {name: .candidate_name, share: .predicted_vote_share}'

# Test API - County Forecast (Nairobi = county 47)
curl -s http://localhost:8001/api/forecasts/county/47/latest?election_year=2027 | jq '.[] | {candidate: .candidate.name, share: .predicted_vote_share, ci: [.lower_bound_90, .upper_bound_90]}'
```

---

## 🎯 **Common Scenarios**

### **Scenario 1: Add 1 New Candidate**

```python
# Before (2 candidates)
candidates = [
    {'name': 'William Ruto', 'party': 'UDA'},
    {'name': 'Raila Odinga', 'party': 'Azimio'},
]

# After (3 candidates)
candidates = [
    {'name': 'William Ruto', 'party': 'UDA'},
    {'name': 'Raila Odinga', 'party': 'Azimio'},
    {'name': 'Kalonzo Musyoka', 'party': 'Wiper'},  # NEW
]
```

**Expected Result:**
- 47 counties × 3 candidates = **141 forecasts**
- Vote shares will sum to 100% in each county

---

### **Scenario 2: Replace Candidates (New Election)**

```python
# 2032 Election - New candidates
candidates = [
    {'name': 'Rigathi Gachagua', 'party': 'UDA'},
    {'name': 'Eugene Wamalwa', 'party': 'DAP-K'},
    {'name': 'Hassan Joho', 'party': 'ODM'},
]
```

**Don't forget to:**
- Change `--year 2032` when running the script
- Create 2032 election in database (script does this automatically)

---

### **Scenario 3: Remove a Candidate**

Simply delete the line from the candidates list and re-run:

```python
# Before
candidates = [
    {'name': 'William Ruto', 'party': 'UDA'},
    {'name': 'Raila Odinga', 'party': 'Azimio'},
    {'name': 'George Wajackoyah', 'party': 'Roots Party'},  # Remove this
]

# After
candidates = [
    {'name': 'William Ruto', 'party': 'UDA'},
    {'name': 'Raila Odinga', 'party': 'Azimio'},
]
```

**Note:** Old forecasts remain in database. New forecast run will only include current candidates.

---

## 🧮 **How Vote Shares Are Calculated**

### **For Candidates with Historical Data:**

```
Historical Performance → Dirichlet Prior → Monte Carlo Sampling → Forecast
```

**Example (Nairobi):**
- Ruto won 45% in 2022 → α₁ = 4.5
- Raila won 35% in 2022 → α₂ = 3.5
- Sample from Dirichlet(4.5, 3.5) → Forecast: 46% vs 34%

### **For New Candidates (No Historical Data):**

```
Uniform Prior → Dirichlet Sampling → Forecast
```

**Example (3 candidates, no history):**
- Uniform prior: 33.3% each
- α = [3.3, 3.3, 3.3]
- Sample from Dirichlet(3.3, 3.3, 3.3) → Forecast: ~33% each (with variation)

### **For New Candidates (Party History Available):**

```
Party Historical Performance → Dirichlet Prior → Forecast
```

**Example (Kalonzo Musyoka - Wiper party):**
- Wiper historically gets 12% in Nairobi
- α = 1.2
- Combined with other candidates → Forecast: ~11-13%

---

## 📊 **Expected Output Sizes**

| Candidates | Counties | Total Forecasts |
|------------|----------|-----------------|
| 2          | 47       | 94              |
| 3          | 47       | 141             |
| 4          | 47       | 188             |
| 5          | 47       | 235             |
| 6          | 47       | 282             |
| 10         | 47       | 470             |

**Formula:** `Total Forecasts = Candidates × Counties`

---

## ⚠️ **Common Errors**

### **Error 1: "Forecast file not found"**

```
❌ Forecast file not found: data/processed/forecasts_2027_multi_candidate.csv
   Run multi_candidate_forecast.py first to generate forecasts
```

**Fix:** Run `python multi_candidate_forecast.py` before `store_forecasts_multi.py`

---

### **Error 2: "Candidate not found in database"**

```
⚠️  Candidate not found: Kalonzo Musyoka (Wiper)
```

**Fix:** The script should auto-create candidates. If not, run:
```bash
python add_candidates.py
```

---

### **Error 3: "Vote shares don't sum to 100%"**

This should **never** happen with Dirichlet distribution. If it does:

**Check:**
1. Are you using `multi_candidate_forecast.py`? (Not `simple_forecast_model.py`)
2. Is the Dirichlet sampling working? Check for errors in output

**Debug:**
```python
# Add this to multi_candidate_forecast.py after sampling
vote_share_sum = vote_share_samples.sum(axis=1)
print(f"Vote share sums: min={vote_share_sum.min()}, max={vote_share_sum.max()}")
# Should print: min=100.0, max=100.0
```

---

## 🎨 **Frontend Customization**

### **Add Party Colors**

Edit `frontend/components/charts/ForecastWithUncertainty.tsx`:

```typescript
const getPartyColor = (party: string) => {
  const colors: Record<string, string> = {
    'UDA': 'bg-yellow-500',
    'Azimio': 'bg-orange-500',
    'Wiper': 'bg-blue-500',
    'ANC': 'bg-green-500',
    'NARC-Kenya': 'bg-purple-500',
    'Roots Party': 'bg-pink-500',
  };
  return colors[party] || 'bg-gray-500';
};

// Use in component:
<div className={`${getPartyColor(forecast.candidate.party)} ...`}>
```

### **Sort Candidates by Vote Share**

```typescript
const sortedForecasts = forecastData.sort((a, b) => 
  b.predicted_vote_share - a.predicted_vote_share
);
```

### **Show Only Top N Candidates**

```typescript
const topCandidates = forecastData
  .sort((a, b) => b.predicted_vote_share - a.predicted_vote_share)
  .slice(0, 5);  // Top 5 only
```

---

## 📚 **File Locations**

| File | Purpose |
|------|---------|
| `models/multi_candidate_forecast.py` | Generate forecasts |
| `models/store_forecasts_multi.py` | Store in database |
| `models/add_candidates.py` | Add candidates only |
| `backend/routers/forecasts.py` | API endpoints |
| `frontend/components/charts/ForecastWithUncertainty.tsx` | Display component |
| `ADDING_NEW_CANDIDATES_GUIDE.md` | Full documentation |

---

## 🚀 **Performance Tips**

### **Faster Forecasting (Development)**

```bash
# Use fewer samples for quick testing
python multi_candidate_forecast.py --samples 500
```

### **Production Forecasting**

```bash
# Use more samples for better accuracy
python multi_candidate_forecast.py --samples 5000
```

### **Parallel Processing (Future Enhancement)**

```python
# In multi_candidate_forecast.py, add:
from multiprocessing import Pool

with Pool(4) as pool:
    forecasts = pool.map(forecast_county, counties)
```

---

## 🎯 **Best Practices Checklist**

- [ ] Always include major historical candidates (Ruto, Raila) for calibration
- [ ] Use at least 2000 samples for stable estimates
- [ ] Verify vote shares sum to 100% in output
- [ ] Test API endpoints before viewing in frontend
- [ ] Document candidate additions in commit messages
- [ ] Back up database before major changes
- [ ] Use descriptive party names (not abbreviations only)
- [ ] Check for duplicate candidates before adding

---

## 📞 **Need Help?**

1. **Check the full guide:** `ADDING_NEW_CANDIDATES_GUIDE.md`
2. **Review model code:** `models/multi_candidate_forecast.py`
3. **Check API logs:** Backend terminal output
4. **Verify database:** Use psql commands above
5. **Test API directly:** Use curl commands above

---

**Last Updated:** 2025-10-04


