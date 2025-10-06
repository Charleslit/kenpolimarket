# 🔧 Scenario Calculator Fix Guide

## Problem Identified

You're seeing this error in the Scenario Calculator:
- **Error**: "Shares must sum to 100%"
- **Current Total**: 50.0%
- **Calculate button**: Disabled (grayed out)

## Root Cause

**You only have 1 presidential candidate** (William Ruto) in the database. The Scenario Calculator needs **at least 2 candidates** to create meaningful "what-if" scenarios.

---

## ✅ Solution: Add More Presidential Candidates

### Option 1: Add Candidates via Admin UI (Recommended)

1. **Navigate to Admin Page**:
   - Go to `/admin` in your browser
   - Click on the **"Candidates"** tab

2. **Add Presidential Candidates**:
   
   **Candidate 1: Raila Odinga**
   - Name: `Raila Odinga`
   - Party: `Azimio`
   - Position: `President`
   - Click "Add Candidate"

   **Candidate 2: William Ruto** (if not already added)
   - Name: `William Ruto`
   - Party: `UDA`
   - Position: `President`
   - Click "Add Candidate"

   **Optional - Add More Candidates**:
   - Name: `George Wajackoyah`
   - Party: `Roots Party`
   - Position: `President`

   - Name: `David Mwaure`
   - Party: `Agano Party`
   - Position: `President`

3. **Verify Candidates**:
   - You should now see multiple candidates in the list
   - Each should have Position: "President"

4. **Return to Scenarios Tab**:
   - Click on the **"Scenarios"** tab
   - You should now see sliders for all candidates
   - The shares should automatically distribute equally (e.g., 50% each for 2 candidates)

---

### Option 2: Add Candidates via API (Advanced)

If your backend is running on `http://localhost:8000`:

```bash
# Add Raila Odinga
curl -X POST http://localhost:8000/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Raila Odinga",
    "party": "Azimio",
    "position": "President"
  }'

# Add William Ruto (if not exists)
curl -X POST http://localhost:8000/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "William Ruto",
    "party": "UDA",
    "position": "President"
  }'

# Add George Wajackoyah (optional)
curl -X POST http://localhost:8000/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "George Wajackoyah",
    "party": "Roots Party",
    "position": "President"
  }'

# Add David Mwaure (optional)
curl -X POST http://localhost:8000/api/candidates \
  -H "Content-Type: application/json" \
  -d '{
    "name": "David Mwaure",
    "party": "Agano Party",
    "position": "President"
  }'
```

---

### Option 3: Import 2022 Presidential Data

Use the sample data file we created:

1. **Navigate to Admin Page** → **"Election Data"** tab
2. Click **"Import Data"** sub-tab
3. Upload the file: `data/sample_2022_presidential.csv`
4. This will automatically create:
   - An election record for "2022 Presidential Election"
   - All 4 presidential candidates
   - Vote results for all 47 counties

---

## 🎯 How to Use Scenario Calculator (After Adding Candidates)

Once you have at least 2 candidates:

### Step 1: Enter Scenario Details
- **Scenario Name**: e.g., "Ruto Wins Back Mount Kenya"
- **Description** (optional): e.g., "What if Ruto gets 70% in Mount Kenya?"

### Step 2: Adjust Regional Shares
1. **Select a Region**: Choose from dropdown (e.g., "Mount Kenya")
2. **Adjust Candidate Shares**: Use sliders to set percentages
   - Example: Ruto 70%, Raila 30%
   - **Important**: Total must equal 100%
3. **Click "Add Adjustment for [Region]"**
4. Repeat for other regions if desired

### Step 3: Calculate Scenario
1. Once you've added at least one regional adjustment
2. Click **"Calculate Scenario"** button
3. View results on the right side:
   - National results with changes
   - Regional breakdown
   - Winner and margin

### Step 4: Export Results (Optional)
- Click the **Export** button (top-right of results)
- Choose: PDF, CSV, or Image

---

## 🔍 What Changed in the Fix

I made the following improvements to the Scenario Calculator:

### 1. **Warning Message for Insufficient Candidates**
- Now shows a yellow warning box when you have < 2 candidates
- Explains why you need more candidates
- Provides instructions on how to add them

### 2. **Auto-Fix for Single Candidate**
- If you only have 1 candidate, the slider automatically locks to 100%
- Prevents the confusing 50% default

### 3. **Better Precision**
- Fixed rounding issues that could cause "99.9%" or "100.1%" totals
- Now uses 2 decimal places for better accuracy

---

## 📊 Example Scenario Workflow

Here's a complete example once you have candidates:

### Scenario: "Ruto Gains in Mount Kenya"

**Candidates**:
- William Ruto (UDA)
- Raila Odinga (Azimio)

**Regional Adjustments**:
1. **Mount Kenya**: Ruto 75%, Raila 25%
2. **Nyanza**: Ruto 20%, Raila 80%
3. **Rift Valley**: Ruto 80%, Raila 20%

**Expected Result**:
- National totals recalculated
- Regional breakdown showing vote changes
- Winner determined
- Margin of victory calculated

---

## ✅ Verification Checklist

After adding candidates, verify:

- [ ] Navigate to `/admin` → "Candidates" tab
- [ ] See at least 2 candidates with Position = "President"
- [ ] Navigate to "Scenarios" tab
- [ ] See sliders for all candidates
- [ ] Total shows "100.0%" in green
- [ ] "Add Adjustment" button is enabled (blue, not gray)
- [ ] Can add regional adjustments
- [ ] "Calculate Scenario" button becomes enabled after adding adjustment
- [ ] Results appear on the right side after calculation

---

## 🐛 Troubleshooting

### Issue: "No candidates found"
**Solution**: Make sure your backend is running and candidates are created with `position="President"`

### Issue: "Shares still don't sum to 100%"
**Solution**: 
- Use the sliders carefully
- Check the total in the green/red box
- Adjust one candidate at a time
- The last candidate should be adjusted to make it exactly 100%

### Issue: "Calculate button still disabled"
**Possible causes**:
1. No regional adjustments added yet → Add at least one
2. Scenario name is empty → Enter a name
3. Shares don't sum to 100% → Adjust sliders

### Issue: "Backend not responding"
**Solution**:
```bash
# Start backend
cd backend
uvicorn main:app --reload --port 8000

# In another terminal, start frontend
cd frontend
npm run dev
```

---

## 📝 Quick Reference: 2022 Presidential Candidates

For realistic scenarios, use these actual 2022 candidates:

| Name | Party | Typical Strongholds |
|------|-------|---------------------|
| William Ruto | UDA | Rift Valley, Mount Kenya (partial) |
| Raila Odinga | Azimio | Nyanza, Western, Coast, Nairobi |
| George Wajackoyah | Roots Party | Minor candidate |
| David Mwaure | Agano Party | Minor candidate |

---

## 🎉 Summary

**Problem**: Only 1 candidate → Can't create scenarios  
**Solution**: Add at least 2 presidential candidates  
**Method**: Use Admin UI → Candidates tab → Add candidates  
**Result**: Scenario Calculator now works with proper validation  

**Your Scenario Calculator is now ready to use!** 🚀


