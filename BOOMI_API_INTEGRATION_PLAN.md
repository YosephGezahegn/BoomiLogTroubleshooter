# Boomi AtomSphere API Integration Plan

## Executive Summary

This document outlines the integration of Boomi AtomSphere API capabilities into the log analysis web application, transforming it from a **passive log analyzer** to an **active monitoring and troubleshooting platform**.

**Key Enhancement:** Users will be able to fetch process logs and execution data directly from Boomi's platform instead of manual file uploads.

---

## 🎯 Strategic Value

### Current State (Manual Upload)
- ❌ Users must manually download logs from Boomi
- ❌ No real-time monitoring capabilities
- ❌ Limited to analyzing historical log files
- ❌ No access to live execution metadata

### Future State (API Integration)
- ✅ Automatic log retrieval from Boomi platform
- ✅ Real-time execution monitoring
- ✅ Access to component metadata
- ✅ Historical execution record queries
- ✅ Automated scheduled analysis
- ✅ Integration with company CI/CD pipelines

---

## 🔌 Boomi AtomSphere API Capabilities

### Available APIs

| API | Purpose | Use Case in Our App |
|-----|---------|---------------------|
| **ExecutionRecord API** | Retrieve process execution metadata | List recent executions, filter by status/date |
| **ProcessLog API** | Download process run logs | Auto-fetch logs for analysis |
| **Component Metadata API** | Get connector/component details | Enrich analysis with component info |
| **Event API** | Query process execution events | Real-time error notifications |
| **Audit Log API** | Track manual process executions | User activity tracking |

### Key Objects

#### 1. ExecutionRecord
```json
{
  "executionId": "string",
  "processId": "string",
  "processName": "string",
  "startTime": "ISO 8601",
  "endTime": "ISO 8601",
  "status": "Success|Error|Canceled",
  "executionMode": "Test|Production|Manual",
  "errorMessage": "string",
  "runtimeId": "string"
}
```

#### 2. ProcessLog
```json
{
  "processLogId": "string",
  "executionId": "string",
  "logLevel": "INFO|DEBUG|SEVERE|WARNING|ALL",
  "downloadUrl": "string",
  "status": "PENDING|READY",
  "expirationTime": "ISO 8601"
}
```

#### 3. ComponentMetadata
```json
{
  "componentId": "string",
  "componentType": "Connector|Map|Decision|Process",
  "name": "string",
  "createdDate": "ISO 8601",
  "modifiedDate": "ISO 8601",
  "folder": "string"
}
```

---

## 🏗️ Integration Architecture

### Dual-Mode Operation

```
┌─────────────────────────────────────────────────────┐
│         Boomi Log Analysis Application              │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐         ┌──────────────┐         │
│  │  Mode 1:     │         │  Mode 2:     │         │
│  │  Manual      │         │  API         │         │
│  │  Upload      │         │  Integration │         │
│  └──────────────┘         └──────────────┘         │
│         │                        │                  │
│         ▼                        ▼                  │
│  ┌──────────────────────────────────────┐          │
│  │      Unified Analysis Engine         │          │
│  │  (Same parsing logic for both modes) │          │
│  └──────────────────────────────────────┘          │
│                      │                              │
│                      ▼                              │
│         ┌───────────────────────┐                  │
│         │  PostgreSQL Database  │                  │
│         └───────────────────────┘                  │
└─────────────────────────────────────────────────────┘
```

### System Components

```typescript
// New components for API integration
src/
├── lib/
│   ├── boomi/
│   │   ├── client.ts              // Boomi API client
│   │   ├── auth.ts                // API token management
│   │   ├── executionRecords.ts    // ExecutionRecord operations
│   │   ├── processLogs.ts         // ProcessLog operations
│   │   ├── componentMetadata.ts   // Component queries
│   │   └── types.ts               // TypeScript interfaces
│   ├── parser/                    // Existing parser (unchanged)
│   └── analytics/                 // Existing analytics (unchanged)
├── app/
│   ├── api/
│   │   ├── analyze/               // Existing manual upload
│   │   ├── boomi/
│   │   │   ├── executions/        // NEW: List executions
│   │   │   ├── fetch-log/         // NEW: Fetch and analyze log
│   │   │   └── components/        // NEW: Get component metadata
│   └── (dashboard)/
│       ├── analyze/                // Existing manual upload page
│       └── monitor/                // NEW: Live monitoring page
```

---

## 📊 Proposed Database Schema Updates

```prisma
model BoomiConnection {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  // API credentials
  accountId   String
  username    String
  apiToken    String   @encrypted // Encrypted at rest
  baseUrl     String   @default("https://api.boomi.com/api/rest/v1")
  
  // Metadata
  name        String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  analyses    Analysis[]
  scheduledJobs ScheduledAnalysis[]
  
  @@unique([userId, accountId])
}

model Analysis {
  id               String   @id @default(cuid())
  userId           String?
  user             User?    @relation(fields: [userId], references: [id])
  
  // Source information
  sourceType       String   // "MANUAL_UPLOAD" | "API_FETCH"
  boomiConnectionId String?
  boomiConnection  BoomiConnection? @relation(fields: [boomiConnectionId], references: [id])
  
  // Boomi-specific metadata (if API-sourced)
  executionId      String?
  processId        String?
  processName      String?
  executionStatus  String?  // "Success" | "Error" | "Canceled"
  executionMode    String?  // "Test" | "Production" | "Manual"
  
  // Existing fields
  fileName         String
  fileSize         Int
  totalLines       Int
  totalDuration    Int
  startTime        DateTime?
  endTime          DateTime?
  mainProcessName  String?
  
  // Analysis results
  results          Json
  processFlow      Json
  warnings         Json
  connectorStats   Json?
  paginationStats  Json?
  errorAnalysis    Json?
  
  createdAt        DateTime @default(now())
}

model ScheduledAnalysis {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  boomiConnectionId String
  boomiConnection   BoomiConnection @relation(fields: [boomiConnectionId], references: [id])
  
  // Schedule configuration
  name              String
  processId         String?  // null = all processes
  cronExpression    String   // e.g., "0 */6 * * *" (every 6 hours)
  isActive          Boolean  @default(true)
  
  // Filters
  onlyErrors        Boolean  @default(false)
  minDuration       Int?     // Only analyze if execution > X seconds
  
  // Notifications
  notifyOnErrors    Boolean  @default(false)
  notifyEmail       String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastRunAt         DateTime?
  nextRunAt         DateTime?
}

model ComponentCache {
  id              String   @id @default(cuid())
  accountId       String
  componentId     String
  componentType   String
  name            String
  metadata        Json
  
  createdAt       DateTime @default(now())
  expiresAt       DateTime
  
  @@unique([accountId, componentId])
  @@index([accountId, componentType])
}
```

---

## 🛠️ Implementation Phases

### Phase 2C: Boomi API Foundation (NEW)
**Estimated: 2 weeks**

#### Tasks

##### 2C.1 Boomi API Client Setup
- [ ] Create `src/lib/boomi/client.ts` - HTTP client with retry logic
- [ ] Implement API token authentication
- [ ] Handle rate limiting (Boomi has API limits)
- [ ] Add request/response logging
- [ ] Write unit tests for client

##### 2C.2 Authentication & Connection Management
- [ ] Create Boomi connection CRUD operations
- [ ] Implement API token encryption at rest
- [ ] Add connection testing endpoint
- [ ] Create connection management UI
- [ ] Validate credentials against Boomi API

##### 2C.3 ExecutionRecord Integration
- [ ] Create `src/lib/boomi/executionRecords.ts`
- [ ] Implement query filters (date range, status, process)
- [ ] Add pagination support
- [ ] Create API endpoint: `/api/boomi/executions`
- [ ] Write integration tests

##### 2C.4 ProcessLog Integration
- [ ] Create `src/lib/boomi/processLogs.ts`
- [ ] Implement async log download with polling
- [ ] Handle large log files (stream to disk)
- [ ] Create API endpoint: `/api/boomi/fetch-log`
- [ ] Add progress tracking for log downloads

##### 2C.5 Component Metadata Integration
- [ ] Create `src/lib/boomi/componentMetadata.ts`
- [ ] Implement component metadata cache
- [ ] Add cache refresh logic (daily)
- [ ] Create API endpoint: `/api/boomi/components`
- [ ] Enrich analysis results with component metadata

---

### Phase 3B: Monitoring Dashboard UI (NEW)
**Estimated: 1.5 weeks**

#### Tasks

##### 3B.1 Connection Setup Page
- [ ] Create `src/app/(dashboard)/settings/boomi/page.tsx`
- [ ] Form to add Boomi API credentials
- [ ] Connection testing with visual feedback
- [ ] List existing connections
- [ ] Edit/delete connection functionality

##### 3B.2 Live Monitoring Dashboard
- [ ] Create `src/app/(dashboard)/monitor/page.tsx`
- [ ] Display recent executions in table
- [ ] Filter by status (Success/Error/All)
- [ ] Filter by date range
- [ ] Filter by process
- [ ] Click execution → auto-fetch and analyze log

##### 3B.3 Execution Detail View
- [ ] Create execution detail modal/page
- [ ] Show execution metadata (status, duration, mode)
- [ ] "Analyze This Execution" button
- [ ] Link to full analysis results
- [ ] Show execution timeline

##### 3B.4 Scheduled Analysis Setup
- [ ] Create scheduled analysis configuration page
- [ ] Cron expression builder UI
- [ ] Process selector
- [ ] Email notification setup
- [ ] Enable/disable toggle

##### 3B.5 Real-time Notifications (Optional)
- [ ] WebSocket or SSE for live updates
- [ ] Toast notifications for new errors
- [ ] Desktop notifications (browser API)

---

## 🔄 User Workflows

### Workflow 1: Manual Upload (Existing)
```
1. User uploads .log file
2. System analyzes locally
3. Results displayed immediately
4. Optionally saved to database
```

### Workflow 2: API-Powered Analysis (NEW)
```
1. User connects Boomi account (one-time setup)
2. User navigates to "Monitor" page
3. System fetches recent executions via API
4. User filters/selects execution of interest
5. User clicks "Analyze"
6. System:
   a. Fetches process log via API
   b. Runs same analysis engine
   c. Enriches with execution metadata
   d. Saves to database with link to execution
7. Results displayed with Boomi context
```

### Workflow 3: Scheduled Analysis (NEW)
```
1. User creates scheduled analysis job
2. System runs on schedule (cron)
3. For each execution in time window:
   a. Fetch log via API
   b. Analyze
   c. Save results
   d. Send notification if errors found
4. User reviews results in history
```

---

## 🎨 UI Mockup Concepts

### Monitor Dashboard
```
┌────────────────────────────────────────────────────────────┐
│  🔍 Boomi Execution Monitor                                │
├────────────────────────────────────────────────────────────┤
│  Connection: MSK-Production ▾   [+ New Connection]         │
│                                                             │
│  Filters:                                                   │
│  Status: [All ▾] | Date: [Last 24h ▾] | Process: [All ▾]  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Process Name             │ Status │ Duration │ Time  │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ RJ-002 Maintenance Feed  │ ✅     │ 57min    │ 2h ago│ │
│  │ MSK-001 Order Sync       │ ❌ 🔍  │ 12min    │ 3h ago│ │
│  │ RJ-005 Contact Update    │ ✅     │ 3min     │ 5h ago│ │
│  └──────────────────────────────────────────────────────┘ │
│                                                             │
│  🔍 = Click to analyze                                     │
└────────────────────────────────────────────────────────────┘
```

### Connection Setup
```
┌────────────────────────────────────────────────────────────┐
│  ⚙️ Boomi API Connection                                   │
├────────────────────────────────────────────────────────────┤
│  Connection Name: [MSK Production            ]             │
│  Account ID:      [mycompany-ABCD12          ]             │
│  Username:        [joe.smith@company.com     ]             │
│  API Token:       [••••••••••••••••••••••••  ]             │
│                                                             │
│  [Test Connection]  [Save]  [Cancel]                       │
│                                                             │
│  ✅ Connection successful!                                 │
└────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

### API Token Storage
- ✅ Encrypt tokens at rest using AES-256
- ✅ Never expose tokens in logs or error messages
- ✅ Use environment variable for encryption key
- ✅ Rotate tokens regularly (notify user)

### Permission Model
```typescript
// Only users can see their own connections
// Admin can see all connections (optional)
```

### Rate Limiting
```typescript
// Boomi API has rate limits
const RATE_LIMIT = {
  requestsPerMinute: 100,
  concurrentRequests: 5
};

// Implement exponential backoff for retries
```

---

## 📈 Enhanced Analysis Capabilities

### Enriched Analysis Results

With API integration, analysis results can include:

```typescript
interface EnrichedAnalysis extends AnalysisResult {
  // Boomi execution context
  executionMetadata: {
    executionId: string;
    processId: string;
    processName: string;
    status: 'Success' | 'Error' | 'Canceled';
    mode: 'Test' | 'Production' | 'Manual';
    triggeredBy: string;  // from Audit Log
    errorSummary?: string;
  };
  
  // Component enrichment
  connectorDetails: {
    [shapeName: string]: {
      componentId: string;
      componentType: string;
      createdBy: string;
      folder: string;
      // Potential: endpoint URLs, connection details
    };
  };
  
  // Comparison with previous runs
  comparison?: {
    previousExecutionId: string;
    performanceDelta: number;  // % change
    newErrors: string[];
    resolvedErrors: string[];
  };
}
```

---

## 🎯 Implementation Priority

### Must Have (MVP)
1. ✅ Boomi API client with authentication
2. ✅ ExecutionRecord API integration
3. ✅ ProcessLog API integration
4. ✅ Connection management UI
5. ✅ Monitor dashboard with execution list
6. ✅ Click-to-analyze from execution list

### Should Have
1. Component metadata enrichment
2. Scheduled analysis jobs
3. Email notifications
4. Execution comparison
5. Advanced filters

### Nice to Have
1. Real-time WebSocket updates
2. Desktop notifications
3. Slack/Teams integration
4. Performance trend dashboards
5. Anomaly detection (ML-based)

---

## 📝 Updated Implementation Timeline

| Phase | Original Duration | New Duration | Added Time |
|-------|-------------------|--------------|------------|
| Phase 1: Foundation | 1 week | 1 week | - |
| Phase 2: Core Parsing | 1.5 weeks | 1.5 weeks | - |
| **Phase 2C: Boomi API** | **-** | **2 weeks** | **+2 weeks** |
| Phase 2B: Advanced Analytics | - | 1.5 weeks | +1.5 weeks |
| Phase 3: UI | 2 weeks | 2 weeks | - |
| **Phase 3B: Monitor UI** | **-** | **1.5 weeks** | **+1.5 weeks** |
| Phase 4: Auth | 1.5 weeks | 1.5 weeks | - |
| Phase 5: Deploy | 1 week | 1 week | - |
| **New Total** | **7 weeks** | **12 weeks** | **+5 weeks** |

**Thesis Timeline:** Still realistic for a Master's thesis (3 months development + documentation)

---

## 🧪 Testing Strategy

### Unit Tests
- Boomi API client methods
- Authentication logic
- Rate limiting
- Error handling

### Integration Tests
- End-to-end execution fetch
- Log download and parse
- Component metadata cache

### Manual Testing Checklist
- [ ] Connect to Boomi account
- [ ] List recent executions
- [ ] Fetch and analyze log
- [ ] Verify enriched metadata
- [ ] Test error handling (invalid token, network error)
- [ ] Test large log files (>20MB)
- [ ] Test scheduled jobs

---

## 🚀 Migration Path

### For Existing Users
```typescript
// Support both modes seamlessly
1. Users can still upload files manually
2. Optionally connect Boomi account
3. Get best of both worlds
```

### For New Features
```typescript
// Graceful degradation
- If no Boomi connection → manual upload only
- If Boomi connection → both modes available
- UI adapts based on connection status
```

---

## 💡 Future Enhancements

### Phase 6: Advanced Integration (Post-Thesis)
1. **Predictive Analytics**
   - ML model to predict process failures
   - Based on historical execution patterns

2. **GitOps Integration**
   - Trigger analysis on deployment
   - Compare pre/post deployment performance

3. **Multi-Account Support**
   - Organizations with multiple Boomi accounts
   - Cross-account analytics

4. **Custom Dashboards**
   - User-defined KPIs
   - Business-specific metrics

5. **API for External Tools**
   - REST API for programmatic access
   - Webhook support for CI/CD

---

## 📚 Technical References

### Boomi API Documentation
- [AtomSphere API Reference](https://help.boomi.com/bundle/integration/page/r-atm-AtomSphere_API_6730e8e4-b2db-4e94-a791-7bf3d8b83f81.html)
- [ExecutionRecord Object](https://help.boomi.com/bundle/integration/page/c-atm-ExecutionRecord_object.html)
- [ProcessLog Object](https://help.boomi.com/bundle/integration/page/c-atm-ProcessLog_object.html)

### Code Examples
```typescript
// Example: Fetch recent executions
const executions = await boomiClient.query({
  QueryFilter: {
    expression: {
      operator: 'and',
      nestedExpression: [
        {
          argument: ['processName'],
          operator: 'EQUALS',
          value: ['RJ-002 Maintenance Feed']
        },
        {
          argument: ['executionTime'],
          operator: 'GREATER_THAN',
          value: [new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()]
        }
      ]
    }
  }
});

// Example: Download process log
const logRequest = await boomiClient.create('ProcessLog', {
  executionId: 'exec-12345',
  logLevel: 'ALL'
});

// Poll until ready
const log = await pollUntilReady(logRequest.processLogId);
const logContent = await downloadLog(log.downloadUrl);
```

---

## ✅ Acceptance Criteria

Before considering API integration complete:

- [ ] User can connect Boomi account with valid credentials
- [ ] User can view list of recent executions
- [ ] User can click execution and analyze its log
- [ ] Analysis results include execution metadata
- [ ] Scheduled jobs run automatically on schedule
- [ ] Email notifications work for error cases
- [ ] API tokens are encrypted at rest
- [ ] Rate limiting prevents API quota exhaustion
- [ ] Error handling is graceful with user-friendly messages
- [ ] Documentation updated with API setup instructions

---

## 📊 Success Metrics

### Technical Metrics
- API response time < 2 seconds (p95)
- Log download and analysis < 10 seconds for typical logs
- Zero token exposure incidents
- <1% API request failure rate

### User Metrics
- 50% of users connect Boomi account
- 30% create scheduled analysis jobs
- 80% reduction in time to identify errors
- Positive user feedback on monitoring features

---

## Conclusion

Integrating Boomi AtomSphere API transforms this thesis project from a **simple log parser** to a **comprehensive integration monitoring platform**. This enhancement:

✅ Increases practical value to the sponsoring company  
✅ Demonstrates advanced full-stack development skills  
✅ Provides rich thesis discussion material  
✅ Creates a production-ready enterprise tool  
✅ Opens opportunities for future enhancements  

**Recommendation:** Implement API integration in the thesis scope. The added complexity is justified by the significant value increase and aligns with Master's level work expectations.
