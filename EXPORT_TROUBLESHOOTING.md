# 📤 Export Functionality - Troubleshooting Guide

## ❌ **PDF Export Failed**

If you're seeing "Export failed. Please try again" when trying to export as PDF, here are the common causes and solutions:

---

## 🔍 **Common Issues & Solutions**

### **Issue 1: Element Not Found**

**Symptom:** Export fails immediately

**Cause:** The element ID doesn't exist or hasn't loaded yet

**Solution:**
1. Wait for the page to fully load before exporting
2. Make sure you're on the correct view (National, Regional, or County)
3. Refresh the page and try again

---

### **Issue 2: Browser Compatibility**

**Symptom:** PDF export works but clipboard copy fails

**Cause:** Clipboard API requires HTTPS (except on localhost)

**Solution:**
- **On localhost:** Should work fine
- **On production:** Must use HTTPS
- **Workaround:** Use PNG/PDF download instead of clipboard

---

### **Issue 3: Large Charts**

**Symptom:** Export takes a long time or fails

**Cause:** Chart is too large or complex

**Solution:**
1. Try exporting a smaller section
2. Close other browser tabs to free up memory
3. Use PNG instead of PDF (smaller file size)

---

### **Issue 4: CORS Errors**

**Symptom:** Console shows CORS errors

**Cause:** External images or fonts not loading

**Solution:**
- Charts should work fine (no external resources)
- If using custom fonts, they must be CORS-enabled

---

## 🛠️ **Quick Fixes**

### **Fix 1: Refresh the Page**
```
1. Press Ctrl+R (Windows/Linux) or Cmd+R (Mac)
2. Wait for page to fully load
3. Try export again
```

### **Fix 2: Try Different Format**
```
If PDF fails:
1. Try PNG export instead
2. If PNG works, the issue is with jsPDF
3. Report the issue with browser details
```

### **Fix 3: Check Browser Console**
```
1. Press F12 to open Developer Tools
2. Click "Console" tab
3. Try export again
4. Look for error messages
5. Share error details for support
```

### **Fix 4: Clear Browser Cache**
```
1. Press Ctrl+Shift+Delete (Windows/Linux) or Cmd+Shift+Delete (Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Refresh the page
```

---

## 🌐 **Browser Compatibility**

### **Fully Supported:**
- ✅ Chrome 90+ (Desktop & Mobile)
- ✅ Edge 90+ (Chromium-based)
- ✅ Firefox 88+
- ✅ Safari 14+

### **Partially Supported:**
- ⚠️ Internet Explorer - NOT SUPPORTED
- ⚠️ Older browsers - May have issues

### **Feature Support:**

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| PNG Export | ✅ | ✅ | ✅ | ✅ |
| PDF Export | ✅ | ✅ | ✅ | ✅ |
| Clipboard Copy | ✅ | ✅ | ⚠️ | ✅ |
| CSV Export | ✅ | ✅ | ✅ | ✅ |
| JSON Export | ✅ | ✅ | ✅ | ✅ |

⚠️ = Requires HTTPS in production

---

## 🐛 **Known Issues**

### **Issue: PDF Export Fails on First Try**

**Status:** Known issue with html2canvas

**Workaround:**
1. Try exporting twice
2. The second attempt usually works
3. This is due to font/image loading delays

**Permanent Fix:** Coming in next update

---

### **Issue: Clipboard Copy Requires HTTPS**

**Status:** Browser security requirement

**Workaround:**
- Use PNG/PDF download instead
- Or deploy to HTTPS domain

**Note:** Works fine on localhost for development

---

### **Issue: Large Charts Take Time**

**Status:** Expected behavior

**Explanation:**
- html2canvas needs to render the entire chart
- Complex charts with many data points take longer
- Typical export time: 2-5 seconds

**Tip:** Be patient, don't click multiple times

---

## 📋 **Error Messages**

### **"Element with ID not found"**

**Meaning:** The chart element doesn't exist

**Fix:**
1. Make sure you're on the correct view
2. Wait for page to load completely
3. Check that data has loaded (no loading spinners)

---

### **"Export failed. Please try again."**

**Meaning:** Generic error (could be many causes)

**Fix:**
1. Check browser console for specific error
2. Try different export format
3. Refresh page and try again
4. Check browser compatibility

---

### **"Failed to copy to clipboard"**

**Meaning:** Clipboard API not available

**Fix:**
1. Make sure you're on HTTPS (or localhost)
2. Check browser permissions
3. Use PNG/PDF download instead

---

## 🔧 **Advanced Troubleshooting**

### **Check if html2canvas is Loaded**

Open browser console and run:
```javascript
console.log(typeof html2canvas);
// Should output: "function"
```

If it outputs "undefined", the library didn't load.

---

### **Check if jsPDF is Loaded**

Open browser console and run:
```javascript
console.log(typeof jsPDF);
// Should output: "function"  
```

If it outputs "undefined", the library didn't load.

---

### **Test Export Manually**

Open browser console and run:
```javascript
import('html2canvas').then(html2canvas => {
  const element = document.getElementById('national-dashboard');
  if (element) {
    html2canvas.default(element).then(canvas => {
      console.log('Success!', canvas);
    });
  } else {
    console.log('Element not found');
  }
});
```

---

## 📞 **Getting Help**

If none of the above solutions work:

1. **Collect Information:**
   - Browser name and version
   - Operating system
   - Error message from console
   - Which export format failed
   - Which view you were on

2. **Check Console:**
   - Press F12
   - Go to Console tab
   - Copy any error messages

3. **Try Minimal Test:**
   - Go to National Overview
   - Wait for data to load
   - Try PNG export
   - Report if it works or fails

4. **Report Issue:**
   - Include all information from above
   - Mention if other formats work
   - Share screenshot if possible

---

## ✅ **Verification Steps**

To verify export is working:

1. **Test PNG Export:**
   ```
   1. Go to National Overview
   2. Click Export → Download as PNG
   3. Check Downloads folder
   4. Open the PNG file
   5. Verify chart is visible
   ```

2. **Test PDF Export:**
   ```
   1. Go to National Overview
   2. Click Export → Download as PDF
   3. Check Downloads folder
   4. Open the PDF file
   5. Verify chart is visible
   ```

3. **Test CSV Export:**
   ```
   1. Go to National Overview
   2. Click Export → Download as CSV
   3. Check Downloads folder
   4. Open in Excel/Sheets
   5. Verify data is correct
   ```

4. **Test Clipboard:**
   ```
   1. Go to National Overview
   2. Click Export → Copy to Clipboard
   3. Open Word/Google Docs
   4. Press Ctrl+V (Cmd+V on Mac)
   5. Verify chart appears
   ```

---

## 🎯 **Best Practices**

1. **Wait for Loading:**
   - Don't export while data is loading
   - Wait for all charts to render
   - Look for loading spinners to disappear

2. **Use Appropriate Format:**
   - **PNG** - For social media, presentations
   - **PDF** - For reports, documents
   - **CSV** - For data analysis
   - **Clipboard** - For quick sharing

3. **Check File Size:**
   - PNG: ~500KB - 2MB
   - PDF: ~200KB - 1MB
   - CSV: ~5KB - 50KB
   - If much larger, something may be wrong

4. **Browser Performance:**
   - Close unnecessary tabs
   - Clear cache if slow
   - Use latest browser version
   - Disable heavy extensions

---

## 🚀 **Performance Tips**

1. **Faster Exports:**
   - Use PNG instead of PDF (faster)
   - Export smaller sections
   - Close other applications
   - Use desktop browser (not mobile)

2. **Better Quality:**
   - Use PDF for best quality
   - Ensure charts are fully loaded
   - Use latest browser version
   - Don't zoom browser in/out

3. **Smaller Files:**
   - Use CSV for data only
   - Use JSON for structured data
   - PNG is smaller than PDF for simple charts

---

## 📚 **Additional Resources**

- **html2canvas Documentation:** https://html2canvas.hertzen.com/
- **jsPDF Documentation:** https://github.com/parallax/jsPDF
- **Browser Compatibility:** https://caniuse.com/

---

**If you're still having issues, please refresh the page and try again. Most export failures are temporary and resolve with a refresh!** 🔄

