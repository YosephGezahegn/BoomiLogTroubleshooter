# Phase 2 Testing Guide

## 🧪 Testing the Log Analyzer

**Phase 2 Status:** 12/14 tasks complete (86%)  
**Ready for Testing:** ✅ YES

---

## Quick Start

### 1. Access the Test Page

Open your browser and navigate to:
```
http://localhost:3000/test-analyzer
```

### 2. Upload Sample Log

Use the provided sample log file:
```
/Users/yosephalemu/Documents/0.School/Thesis/BoomiLogTroubleshooter/sample_log.log
```

### 3. View Results

The page will display:
- ✅ Summary (file info, duration, documents)
- ✅ Top slowest shapes
- ✅ Errors by type
- ✅ Connector statistics
- ✅ Pagination detection
- ✅ Raw JSON output

---

## API Endpoints

### POST /api/analyze

**Upload and analyze a log file**

**Request:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "file=@sample_log.log" \
  -F "topN=10" \
  -F "includeFlow=true" \
  -F "includeConnectors=true" \
  -F "includePagination=true"
```

**Parameters:**
- `file` (required) - Log file (.log or .txt)
- `topN` (optional, default: 10) - Number of slowest shapes
- `includeFlow` (optional, default: true) - Include process flow
- `includeConnectors` (optional, default: true) - Include connector stats
- `includePagination` (optional, default: true) - Include pagination detection

**Response:**
```json
{
  "summary": {
    "fileName": "sample_log.log",
    "fileSize": 3456,
    "lineCount": 30,
    "processName": "TestProcess_v1",
    "duration": 12456,
    "totalShapes": 25,
    "documentsProcessed": 123,
    "errorCount": 2,
    "warningCount": 2
  },
  "topSlowShapes": [...],
  "errorAnalysis": {...},
  "connectorStats": {...},
  "processFlow": {...},
  "paginationData": {...}
}
```

### GET /api/analyze

**Get API information**

```bash
curl http://localhost:3000/api/analyze
```

---

## Expected Results (Sample Log)

### Summary
- **File:** sample_log.log (~3.5 KB)
- **Lines:** 30
- **Process:** TestProcess_v1
- **Duration:** ~12 seconds
- **Documents:** 123 total
- **Errors:** 2 (1 severe, 1 warning)

### Top Slow Shapes
1. Database Connector (SELECT) - 1234 ms
2. Database Connector (SELECT) - 1123 ms
3. Database Connector (SELECT) - 987 ms
4. Database Connector (INSERT) - 678 ms
5. HTTP Connector (POST) - 567 ms

### Errors
- **SEVERE:** HTTP 500 Internal Server Error
- **WARNING:** HTTP 429 Too Many Requests
- **WARNING:** Validation warning (missing email)

### Connectors
- **Database Connector:** 4 calls, avg 1005 ms
- **HTTP Connector:** 9 calls, avg 374 ms

### Pagination
- **Detected:** Yes
- **Pattern:** f_0_0_0
- **Iterations:** 3 (f_0_0_0_1, f_0_0_0_2)
- **Max Depth:** 4

---

## Testing Checklist

### ✅ Basic Functionality
- [ ] Upload sample log file
- [ ] Verify analysis completes successfully
- [ ] Check summary displays correctly
- [ ] Verify top slow shapes are sorted
- [ ] Confirm error detection works
- [ ] Validate connector extraction
- [ ] Check pagination detection

### ✅ Error Handling
- [ ] Try uploading non-log file (should fail)
- [ ] Try uploading empty file (should fail)
- [ ] Try uploading file > 50MB (should fail)
- [ ] Verify error messages are clear

### ✅ Performance
- [ ] Measure analysis time for sample log (should be < 1 second)
- [ ] Check memory usage (should be minimal)
- [ ] Verify no crashes or freezes

### ✅ Data Accuracy
- [ ] Verify shape count matches log
- [ ] Check execution times are correct
- [ ] Validate error categorization
- [ ] Confirm document counts
- [ ] Verify timestamps

---

## Testing with Real Log File

If you have the real 21MB log file:

### Expected Performance
- **File:** ProcessLog_793039812320592671.log
- **Size:** 21 MB
- **Lines:** 205,612
- **Expected Time:** < 5 seconds
- **Memory:** < 500 MB

### Expected Results
- **Shapes:** ~81,934
- **Errors:** ~36
- **Documents:** ~4,359,706
- **Duration:** ~57 minutes
- **Connectors:** Multiple HTTP/Database

### Test Command
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "file=@ProcessLog_793039812320592671.log" \
  -F "topN=20" \
  -F "includeFlow=true" \
  -F "includeConnectors=true" \
  -F "includePagination=true"
```

---

## Debugging

### Check Server Logs
```bash
# Terminal running npm run dev will show:
# - File upload info
# - Analysis progress
# - Errors (if any)
```

### Common Issues

**1. "Cannot find module" errors**
```bash
# Restart dev server
cd webapp
npm run dev
```

**2. File upload fails**
- Check file size (< 50MB)
- Verify file extension (.log or .txt)
- Ensure file is tab-separated format

**3. Analysis takes too long**
- Check file size
- Verify not running other heavy processes
- Consider using `quickAnalyze` for large files

**4. TypeScript errors**
```bash
# Check types
cd webapp
npx tsc --noEmit
```

---

## Performance Benchmarks

### Target Metrics
| File Size | Lines | Expected Time | Max Memory |
|-----------|-------|---------------|------------|
| 1 KB | 10 | < 0.1s | < 10 MB |
| 100 KB | 1,000 | < 0.5s | < 50 MB |
| 1 MB | 10,000 | < 1s | < 100 MB |
| 10 MB | 100,000 | < 3s | < 300 MB |
| 21 MB | 205,000 | < 5s | < 500 MB |

### Actual Results (to be filled in)
| File Size | Lines | Actual Time | Actual Memory |
|-----------|-------|-------------|---------------|
| 3.5 KB | 30 | ___ | ___ |
| 21 MB | 205,612 | ___ | ___ |

---

## Next Steps After Testing

### If Tests Pass ✅
1. Mark Phase 2 as complete
2. Save analysis results to database
3. Move to Phase 3 (UI)

### If Tests Fail ❌
1. Review error logs
2. Fix identified issues
3. Re-test
4. Document any changes

---

## Advanced Testing

### Load Testing
```bash
# Test with multiple concurrent requests
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/analyze \
    -F "file=@sample_log.log" &
done
wait
```

### Stress Testing
```bash
# Test with very large file
# (Create a large log by duplicating sample_log.log)
cat sample_log.log sample_log.log sample_log.log > large_log.log
# Repeat until file is ~10MB
```

### Edge Cases
- Empty log file
- Log with only errors
- Log with no timing data
- Malformed log lines
- Mixed line endings (\n, \r\n, \r)
- Unicode characters
- Very long lines (> 10KB)

---

## Success Criteria

Phase 2 is complete when:

✅ API endpoint accepts file uploads  
✅ Analysis completes successfully  
✅ Results are accurate  
✅ Performance meets targets  
✅ Error handling works correctly  
✅ All edge cases handled  
✅ Documentation is complete  

---

_Last Updated: February 12, 2026_  
_Status: Ready for Testing_
