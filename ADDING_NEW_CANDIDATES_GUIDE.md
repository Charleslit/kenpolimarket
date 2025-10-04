# 🗳️ Guide: Adding New Presidential Candidates to Forecasting System

## Overview

This guide explains how to add new presidential candidates to the KenPoliMarket forecasting system and generate forecasts that include them.

---

## 📋 **Table of Contents**

1. [Quick Start](#quick-start)
2. [Detailed Steps](#detailed-steps)
3. [How the Multi-Candidate Model Works](#how-the-multi-candidate-model-works)
4. [Frontend Integration](#frontend-integration)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 **Quick Start**

### **Option 1: Add Candidates and Generate Forecasts (Recommended)**

```bash
# Step 1: Edit the candidate list in multi_candidate_forecast.py
# (See line 200-205 in the file)

# Step 2: Generate forecasts for all candidates
cd models
source ../backend/venv/bin/activate
python multi_candidate_forecast.py --samples 2000

# Step 3: Store forecasts in database
python store_forecasts_multi.py

# Step 4: Verify in API
curl http://localhost:8001/api/forecasts/latest?election_year=2027 | jq '.'

# Step 5: View in frontend
# Open http://localhost:3000/forecasts
```

### **Option 2: Add Candidates Only (No Forecasts Yet)**

```bash
# Step 1: Edit the candidate list in add_candidates.py
# (See line 32-37 in the file)

# Step 2: Add candidates to database
cd models
source ../backend/venv/bin/activate
python add_candidates.py
```

---

## 📖 **Detailed Steps**

### **Step 1: Define New Candidates**

Edit `models/multi_candidate_forecast.py` and modify the candidates list (around line 200):

```python
# Define candidates for 2027
candidates = [
    {'name': 'William Ruto', 'party': 'UDA'},
    {'name': 'Raila Odinga', 'party': 'Azimio'},
    {'name': 'Kalonzo Musyoka', 'party': 'Wiper'},
    {'name': 'Musalia Mudavadi', 'party': 'ANC'},
    {'name': 'Martha Karua', 'party': 'NARC-Kenya'},
    {'name': 'George Wajackoyah', 'party': 'Roots Party'},
    # Add more candidates here
]
```

**Important Notes:**
- Use exact spelling for candidate names
- Party names should match historical data if available
- You can add as many candidates as needed
- The model will automatically handle vote share allocation

---

### **Step 2: Generate Multi-Candidate Forecasts**

Run the forecasting model:

```bash
cd models
source ../backend/venv/bin/activate
python multi_candidate_forecast.py --samples 2000 --year 2027
```

**What this does:**
- Loads historical election data
- Estimates baseline support for each candidate
- Uses Dirichlet distribution to ensure vote shares sum to 100%
- Generates county-level forecasts for all candidates
- Saves results to `data/processed/forecasts_2027_multi_candidate.csv`

**Output:**
```
🗳️  MULTI-CANDIDATE FORECASTING MODEL
================================================================================

Election Year: 2027
Monte Carlo Samples: 2,000
Model: Dirichlet Distribution with Historical Priors

📂 Loading data...
   ✓ Loaded 47 counties
   ✓ Loaded 188 historical results

👥 Candidates (6):
   1. William Ruto (UDA)
   2. Raila Odinga (Azimio)
   3. Kalonzo Musyoka (Wiper)
   4. Musalia Mudavadi (ANC)
   5. Martha Karua (NARC-Kenya)
   6. George Wajackoyah (Roots Party)

🔮 Generating forecasts for 6 candidates...
   Candidates: William Ruto, Raila Odinga, Kalonzo Musyoka, ...
   Counties: 47
   Samples: 2,000

   Processed 10/47 counties...
   Processed 20/47 counties...
   Processed 30/47 counties...
   Processed 40/47 counties...

✅ Generated 282 forecasts
   (47 counties × 6 candidates)

📊 NATIONAL FORECAST SUMMARY
================================================================================

Total Predicted Votes: 20,500,000

1. William Ruto              45.20%  (9,266,000 votes)
2. Raila Odinga              32.50%  (6,662,500 votes)
3. Kalonzo Musyoka           12.30%  (2,521,500 votes)
4. Musalia Mudavadi           6.80%  (1,394,000 votes)
5. Martha Karua               2.50%    (512,500 votes)
6. George Wajackoyah          0.70%    (143,500 votes)

================================================================================
```

---

### **Step 3: Store Forecasts in Database**

```bash
python store_forecasts_multi.py
```

**What this does:**
- Reads forecasts from CSV file
- Creates candidate records in database (if they don't exist)
- Creates a new forecast run
- Stores all county-level forecasts
- Links forecasts to candidates and counties

**Output:**
```
💾 STORING MULTI-CANDIDATE FORECASTS IN DATABASE
================================================================================

📂 Loaded 282 forecasts from data/processed/forecasts_2027_multi_candidate.csv

👥 Found 6 candidates:
   - William Ruto (UDA)
   - Raila Odinga (Azimio)
   - Kalonzo Musyoka (Wiper)
   - Musalia Mudavadi (ANC)
   - Martha Karua (NARC-Kenya)
   - George Wajackoyah (Roots Party)

🗳️  Election Year: 2027

================================================================================
STEP 1: Create/Update Candidates
================================================================================
   ✅ Created new candidate: Kalonzo Musyoka (Wiper) - ID: 7
   ✅ Created new candidate: Musalia Mudavadi (ANC) - ID: 8
   ✅ Created new candidate: Martha Karua (NARC-Kenya) - ID: 9
   ✅ Created new candidate: George Wajackoyah (Roots Party) - ID: 10

================================================================================
STEP 2: Create/Get Election
================================================================================
   ✅ Created election: 2027 Presidential - ID: 3

================================================================================
STEP 3: Create Forecast Run
================================================================================
   ✅ Created forecast run: a1b2c3d4-e5f6-7890-abcd-ef1234567890

================================================================================
STEP 4: Store County Forecasts
================================================================================

📊 Storing 282 county forecasts...
   Stored 50/282 forecasts...
   Stored 100/282 forecasts...
   Stored 150/282 forecasts...
   Stored 200/282 forecasts...
   Stored 250/282 forecasts...
   ✅ Stored 282 forecasts

================================================================================
✅ SUCCESS!
================================================================================

📊 Summary:
   - Forecast Run ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
   - Election: 2027
   - Candidates: 6
   - Counties: 47
   - Total Forecasts: 282
```

---

### **Step 4: Verify in API**

Test the API endpoints:

```bash
# Get latest forecast run
curl http://localhost:8001/api/forecasts/latest?election_year=2027 | jq '.'

# Get county-specific forecasts (Nairobi)
curl http://localhost:8001/api/forecasts/county/47/latest?election_year=2027 | jq '.'

# Get national summary
curl http://localhost:8001/api/forecasts/summary/national | jq '.'
```

---

### **Step 5: View in Frontend**

1. Open http://localhost:3000/forecasts
2. Select a county from the map
3. Click the "🔮 2027 Forecast" tab
4. **All candidates will automatically appear!**

The frontend will display:
- Forecast cards for each candidate
- Predicted vote share
- 90% credible intervals
- Predicted votes and turnout

---

## 🧮 **How the Multi-Candidate Model Works**

### **Key Innovation: Dirichlet Distribution**

The model uses a **Dirichlet distribution** to ensure vote shares always sum to 100%.

**Why Dirichlet?**
- Traditional approach: Model each candidate independently → shares may not sum to 100%
- Dirichlet approach: Models all candidates jointly → shares guaranteed to sum to 100%

### **Mathematical Details**

For each county, the model:

1. **Estimates baseline support** for each candidate:
   - Uses historical data if available
   - Uses party affiliation patterns
   - Uses uniform prior for new candidates

2. **Converts to Dirichlet parameters (α)**:
   ```
   α_i = baseline_support_i / 10.0
   ```

3. **Samples vote shares**:
   ```
   vote_shares ~ Dirichlet(α_1, α_2, ..., α_n)
   ```
   This ensures: Σ vote_shares = 100%

4. **Calculates uncertainty**:
   - 90% credible interval from Monte Carlo samples
   - Lower bound: 5th percentile
   - Upper bound: 95th percentile

### **Handling New Candidates**

For candidates with no historical data:

1. **Uniform Prior**: Assume equal support across all candidates
   ```
   baseline_support = 100% / n_candidates
   ```

2. **Party Affiliation**: If the candidate's party has historical data, use that
   ```
   baseline_support = avg(party_historical_performance)
   ```

3. **Regional Patterns**: Adjust based on county demographics
   ```
   baseline_support *= demographic_multiplier
   ```

---

## 🎨 **Frontend Integration**

### **Automatic Display**

The frontend **automatically displays all candidates** without any code changes!

**How it works:**

1. **API returns all candidates** for a county:
   ```json
   [
     {"candidate": {"name": "William Ruto", "party": "UDA"}, "predicted_vote_share": 45.2, ...},
     {"candidate": {"name": "Raila Odinga", "party": "Azimio"}, "predicted_vote_share": 32.5, ...},
     {"candidate": {"name": "Kalonzo Musyoka", "party": "Wiper"}, "predicted_vote_share": 12.3, ...},
     ...
   ]
   ```

2. **Frontend maps over candidates**:
   ```typescript
   {forecastData.map((forecast) => (
     <ForecastCard
       key={forecast.candidate.id}
       candidate={forecast.candidate.name}
       party={forecast.candidate.party}
       predictedShare={forecast.predicted_vote_share}
       lowerBound={forecast.lower_bound_90}
       upperBound={forecast.upper_bound_90}
       ...
     />
   ))}
   ```

3. **Result**: All candidates appear automatically!

### **Customization (Optional)**

If you want to customize the display:

**Color Coding by Party:**
```typescript
const partyColors = {
  'UDA': 'bg-yellow-500',
  'Azimio': 'bg-orange-500',
  'Wiper': 'bg-blue-500',
  'ANC': 'bg-green-500',
  'NARC-Kenya': 'bg-purple-500',
  'Roots Party': 'bg-pink-500',
};
```

**Sorting by Vote Share:**
```typescript
const sortedForecasts = forecastData.sort((a, b) => 
  b.predicted_vote_share - a.predicted_vote_share
);
```

---

## 🔧 **Troubleshooting**

### **Issue 1: "No historical data for candidate X"**

**Cause:** New candidate with no historical performance data

**Solution:** This is expected! The model uses a uniform prior for new candidates.

**To improve accuracy:**
- Add party historical data
- Add regional demographic patterns
- Manually set baseline support in the code

---

### **Issue 2: Vote shares don't sum to exactly 100%**

**Cause:** Rounding errors in display

**Solution:** This is cosmetic. The underlying model ensures exact sum to 100%.

**Fix display:**
```python
# Normalize displayed values
total = sum(vote_shares)
normalized_shares = [s / total * 100 for s in vote_shares]
```

---

### **Issue 3: Candidate not appearing in frontend**

**Checklist:**
1. ✅ Candidate added to database? Check with:
   ```sql
   SELECT * FROM candidates ORDER BY id DESC LIMIT 10;
   ```

2. ✅ Forecasts generated? Check CSV file:
   ```bash
   grep "Candidate Name" data/processed/forecasts_2027_multi_candidate.csv
   ```

3. ✅ Forecasts stored in database? Check with:
   ```sql
   SELECT COUNT(*) FROM forecast_county WHERE candidate_id = X;
   ```

4. ✅ API returning data? Test with:
   ```bash
   curl http://localhost:8001/api/forecasts/county/1/latest?election_year=2027
   ```

---

## 📊 **Example: Adding 3 New Candidates**

Let's walk through a complete example:

### **Scenario:**
Add Kalonzo Musyoka, Musalia Mudavadi, and Martha Karua to 2027 forecasts

### **Step-by-Step:**

**1. Edit `models/multi_candidate_forecast.py`:**
```python
candidates = [
    {'name': 'William Ruto', 'party': 'UDA'},
    {'name': 'Raila Odinga', 'party': 'Azimio'},
    {'name': 'Kalonzo Musyoka', 'party': 'Wiper'},      # NEW
    {'name': 'Musalia Mudavadi', 'party': 'ANC'},       # NEW
    {'name': 'Martha Karua', 'party': 'NARC-Kenya'},    # NEW
]
```

**2. Generate forecasts:**
```bash
cd models
source ../backend/venv/bin/activate
python multi_candidate_forecast.py --samples 2000
```

**3. Store in database:**
```bash
python store_forecasts_multi.py
```

**4. Verify:**
```bash
curl http://localhost:8001/api/forecasts/summary/national | jq '.candidates'
```

**Expected output:**
```json
{
  "candidates": [
    {"candidate_name": "William Ruto", "predicted_vote_share": 42.5},
    {"candidate_name": "Raila Odinga", "predicted_vote_share": 35.2},
    {"candidate_name": "Kalonzo Musyoka", "predicted_vote_share": 13.8},
    {"candidate_name": "Musalia Mudavadi", "predicted_vote_share": 6.5},
    {"candidate_name": "Martha Karua", "predicted_vote_share": 2.0}
  ]
}
```

**5. View in frontend:**
- Open http://localhost:3000/forecasts
- Select any county
- Click "🔮 2027 Forecast" tab
- **All 5 candidates appear automatically!**

---

## 🎯 **Best Practices**

1. **Always use Dirichlet model** for multi-candidate forecasts (ensures sum to 100%)
2. **Include historical candidates** (Ruto, Raila) for calibration
3. **Use party affiliation** for new candidates when possible
4. **Generate at least 2000 samples** for stable uncertainty estimates
5. **Verify national totals** sum to 100% before storing
6. **Test API endpoints** before viewing in frontend
7. **Document candidate additions** in commit messages

---

## 📚 **Additional Resources**

- **Dirichlet Distribution**: https://en.wikipedia.org/wiki/Dirichlet_distribution
- **Multi-Candidate Forecasting**: See `models/multi_candidate_forecast.py`
- **Database Schema**: See `database/schema.sql`
- **API Documentation**: See `backend/routers/forecasts.py`

---

**🎊 You're now ready to add any number of candidates to the forecasting system!** 🇰🇪🗳️📊


