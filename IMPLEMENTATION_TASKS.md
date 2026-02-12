# Implementation Task Tracker

This document breaks down the thesis implementation into actionable tasks. Check off items as you complete them.

---

## Quick Reference

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Complete | 7/7 |
| Phase 2: Core Parsing | ✅ Complete | 14/14 |
| Phase 2B: Advanced Analytics | ⬜ Not Started | 0/10 |
| Phase 2C: Boomi API Integration | ⬜ Not Started | 0/12 |
| Phase 3: UI | 🟡 In Progress | 7/16 |
| Phase 3B: Monitoring Dashboard | ⬜ Not Started | 0/10 |
| Phase 4: Auth | ⬜ Not Started | 0/11 |
| Phase 5: Deploy | ⬜ Not Started | 0/10 |

**Total Progress:** 28/90 tasks (31%)

> ✅ **Phase 1 Complete:** February 10, 2026 - Foundation ready in 50 minutes!  
> ✅ **Phase 2 Complete:** February 12, 2026 - Core parsing engine fully operational!  
> 🟡 **Phase 3 In Progress:** February 12, 2026 - UI development started (7/16 tasks)

> 📊 **Based on analysis of real 21MB Boomi log file (205K lines)**  
> 🔌 **NEW: Boomi AtomSphere API Integration** - Live monitoring capability  
> See `LOG_ANALYSIS_INSIGHTS.md` and `BOOMI_API_INTEGRATION_PLAN.md` for details

---

## Phase 1: Project Foundation

**Goal:** Get the development environment running with a basic application skeleton.

### 1.1 Initialize Next.js Project ✅
- [x] Run `npx create-next-app@latest` with TypeScript and App Router
- [x] Verify the development server starts correctly
- [x] Review and clean up default boilerplate files

**Command reference:**
```bash
npx create-next-app@latest ./ --typescript --eslint --app --src-dir --import-alias "@/*"
```

### 1.2 Configure Development Tools ✅
- [x] Configure ESLint rules for the project
- [x] Set up Prettier with consistent formatting rules
- [x] Create `.editorconfig` for editor consistency
- [x] Add VS Code recommended extensions file

### 1.3 Set Up CSS Architecture ✅
- [x] Create `src/app/globals.css` with CSS custom properties (design tokens)
- [x] Define color palette, typography scale, and spacing system
- [x] Set up CSS reset/normalization
- [x] Create reusable utility classes

**Design tokens to define:**
```css
:root {
  /* Colors */
  --color-primary: ...;
  --color-background: ...;
  --color-surface: ...;
  --color-text: ...;
  --color-error: ...;
  --color-warning: ...;
  --color-success: ...;
  
  /* Typography */
  --font-family: ...;
  --font-size-sm: ...;
  --font-size-base: ...;
  --font-size-lg: ...;
  --font-size-xl: ...;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  /* etc. */
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
}
```

### 1.4 Create Basic Layout ✅
- [x] Update `src/app/layout.tsx` with proper metadata and fonts
- [x] Import global CSS
- [x] Set up Inter font from Google Fonts
- [ ] Create `src/components/layout/Header.tsx` (Phase 3)
- [ ] Create `src/components/layout/Footer.tsx` (Phase 3)
- [ ] Implement responsive navigation (Phase 3)

### 1.5 Set Up PostgreSQL ✅
- [x] Created `docker-compose.yml` for Docker (optional)
- [x] Used Homebrew PostgreSQL@14 service
- [x] Created database: `boomi_log_analyzer`
- [x] Created `.env` with DATABASE_URL
- [x] Installed Prisma: `npm install prisma @prisma/client`
- [x] Initialized Prisma: `npx prisma init`

**Docker Compose template:**
```yaml
version: '3.8'
services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: boomi_logs
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 1.6 Define Database Schema ✅
- [x] Defined complete schema with 8 models in `prisma/schema.prisma`
- [x] Created User, Analysis, BoomiConnection models
- [x] Created ScheduledAnalysis, ApiUsageLog models
- [x] Created ComponentCache, Notification, AuditLog models
- [x] Applied migration: `npx prisma migrate dev --name init`
- [x] Generated Prisma client
- [x] Created database utility: `src/lib/db.ts`

**Models Created:** User, Analysis, BoomiConnection, ScheduledAnalysis, ApiUsageLog, ComponentCache, Notification, AuditLog

### 1.7 Documentation ✅
- [x] Created DATABASE.md with complete setup guide
- [x] Created .env.example for environment variables
- [x] Created progress reports (PROGRESS_PHASE1.md, PROGRESS_PHASE1_DATABASE.md)
- [x] All configuration files are self-documenting

---

## Phase 2: Core Parsing Logic

**Goal:** Port all Python parsing functions to TypeScript with enhanced features from real log analysis.

> ⚠️ **Important Discovery:** Real Boomi logs use **tab-separated** values, not spaces!
> Format: `TIMESTAMP\tLOG_LEVEL\tSHAPE_NAME\tCOMPONENT\tMESSAGE`

### 2.1 Create Log Line Parser
- [ ] Create `src/lib/parser/logLineParser.ts`
- [ ] Parse tab-separated log format
- [ ] Extract all 5 columns from each line
- [ ] Handle edge cases (missing columns, special characters)
- [ ] Create `LogEntry` interface

**Log entry interface:**
```typescript
interface LogEntry {
  lineNumber: number;
  timestamp: Date;
  level: 'INFO' | 'WARNING' | 'SEVERE';
  shapeName: string;
  component: string | null;
  message: string;
  raw: string;
}
```

### 2.2 Create MinHeap Utility
- [ ] Create `src/lib/utils/MinHeap.ts`
- [ ] Implement push, pop, peek, and size methods
- [ ] Add TypeScript generics for type safety
- [ ] Write unit tests

### 2.3 Port Time Extractor (Enhanced)
- [ ] Create `src/lib/parser/timeExtractor.ts`
- [ ] Implement `findLargestMsTimes()` function
- [ ] Handle regex patterns for execution times
- [ ] Track document counts per shape
- [ ] Calculate seconds and minutes from milliseconds
- [ ] **NEW:** Calculate percentiles (p50, p95, p99)

**Key regex patterns:**
```typescript
const TIME_PATTERN = /(\d+)\s+ms\./g;
const DOC_PATTERN = /with\s+(\d+)\s+document\(s\)/;
```

### 2.4 Port Shape Name Extractor (Enhanced)
- [ ] Create `src/lib/parser/shapeExtractor.ts`
- [ ] Implement `extractShapeName()` function
- [ ] Handle named shapes: `INFO Connector [Category] ShapeName: ...`
- [ ] Handle unnamed shapes from previous line context
- [ ] Handle Decision and Data Process patterns
- [ ] **NEW:** Extract shape type counts (Decision, Connector, Branch, etc.)

**Shape types discovered:**
```typescript
type ShapeType = 
  | 'Start' | 'Stop' | 'Branch' | 'Decision'
  | 'Connector' | 'Map' | 'Try/Catch' | 'Process Call'
  | 'Set Properties' | 'Data Process' | 'Message' | 'Notify';
```

### 2.5 Create Connector Extractor (NEW)
- [ ] Create `src/lib/parser/connectorExtractor.ts`
- [ ] Parse connector details: `[Common] HTTP.01 HubSpot API: http Connector; [HS] GET ALL`
- [ ] Extract connector type (HTTP, Database, FTP, etc.)
- [ ] Extract connector name and operation
- [ ] Count calls per connector
- [ ] Track connector latency statistics

**Connector regex:**
```typescript
const CONNECTOR_REGEX = /\[Common\]\s+([^:]+):\s*([^;]+)(?:;\s*(.+))?/;
// Groups: [1] connector name, [2] connector type, [3] operation name
```

### 2.6 Create Error Categorizer (NEW)
- [ ] Create `src/lib/parser/errorCategorizer.ts`
- [ ] Parse HTTP error codes from SEVERE messages
- [ ] Group errors by category (4xx client, 5xx server)
- [ ] Extract error messages and components
- [ ] Calculate error rate percentage

**Error patterns discovered:**
```typescript
const HTTP_ERROR_REGEX = /Code\s+(\d{3}):\s+(.+)/;
// 400 Bad Request, 409 Conflict, 502 Bad Gateway, etc.
```

### 2.7 Port Process Flow Extractor (Enhanced)
- [ ] Create `src/lib/parser/processFlowExtractor.ts`
- [ ] Implement `extractProcessFlow()` function
- [ ] Extract process name from "Executing Process" lines
- [ ] Track step sequence and connections
- [ ] Handle subprocess calls with `[Sub]` prefix
- [ ] Associate execution times with steps
- [ ] **NEW:** Build process hierarchy tree
- [ ] **NEW:** Detect fiber continuation patterns (`f_0_0_0...`)

### 2.8 Port Warnings Extractor
- [ ] Create `src/lib/parser/warningsExtractor.ts`
- [ ] Implement `extractWarningsAndSevere()` function
- [ ] Parse timestamp, level, component, and message
- [ ] Filter for WARNING and SEVERE levels only

### 2.9 Create Unified Parser Module
- [ ] Create `src/lib/parser/index.ts`
- [ ] Create `analyzeLogFile()` function that calls all extractors
- [ ] Define TypeScript interfaces for all return types
- [ ] Export everything from single entry point

**Updated interface definitions:**
```typescript
interface AnalysisResult {
  // Core analysis
  executionTimes: ExecutionTimeResult[];
  processFlow: ProcessFlowResult;
  warnings: WarningResult[];
  
  // NEW: Enhanced analytics
  connectorStats: ConnectorStats[];
  errorAnalysis: ErrorAnalysis;
  shapeTypeDistribution: Record<ShapeType, number>;
  paginationInfo: PaginationInfo | null;
  
  // Metadata
  metadata: {
    filename: string;
    fileSize: number;
    totalLines: number;
    processedAt: Date;
    startTime: Date;
    endTime: Date;
    totalDuration: number; // in seconds
    mainProcessName: string | null;
    documentCount: number;
    errorRate: number; // percentage
  };
}
```

### 2.10 Write Unit Tests
- [ ] Create `tests/parser/` directory
- [ ] Add sample log files for testing in `tests/fixtures/`
- [ ] **Add the real log file sample** for realistic testing
- [ ] Write tests for all extractors
- [ ] Test edge cases (empty files, no matches, etc.)
- [ ] Test performance with 200K+ line files

### 2.11 Create Analyze API Endpoint
- [ ] Create `src/app/api/analyze/route.ts`
- [ ] Handle POST requests with multipart form data
- [ ] Parse uploaded file content
- [ ] Call parsing functions
- [ ] Return JSON response

### 2.12 Handle File Validation
- [ ] Check file extension (.txt, .log only)
- [ ] Check file size (limit to 50MB for large logs)
- [ ] Handle encoding issues (UTF-8)
- [ ] Return appropriate error messages

### 2.13 Streaming Parser for Large Files (NEW)
- [ ] Create `src/lib/parser/streamParser.ts`
- [ ] Process file line-by-line for memory efficiency
- [ ] Support files over 20MB without memory issues
- [ ] Report progress percentage during parsing

### 2.14 Integration Testing
- [ ] Test complete upload flow with Postman/curl
- [ ] Verify response structure matches frontend expectations
- [ ] Test error cases (invalid file, too large, etc.)
- [ ] **Test with real 21MB log file**
- [ ] Benchmark parsing time (<5 seconds for 200K lines)

---

## Phase 2B: Advanced Analytics (NEW)

**Goal:** Add advanced analysis features discovered from real log file patterns.

### 2B.1 Pagination Loop Detector
- [ ] Create `src/lib/analytics/paginationDetector.ts`
- [ ] Detect fiber continuation patterns (`Continuation f_0_0_0...`)
- [ ] Count pagination iterations
- [ ] Calculate total pages fetched
- [ ] Identify inefficient pagination (too many small pages)

**Pattern to detect:**
```
Executing Process [Sub] Get All from Hubspot (Continuation f_0_0_0_0_0...)
```

### 2B.2 Process Hierarchy Builder
- [ ] Create `src/lib/analytics/processHierarchy.ts`
- [ ] Parse main process and subprocess calls
- [ ] Build tree structure of process relationships
- [ ] Track execution time per subprocess
- [ ] Calculate percentage of total time per subprocess

**Example hierarchy:**
```
Main: RJ-002 Maintainance_feed to HS (57 min total)
├── [Sub] Get All Contacts from HS (48%)
│   └── [Sub] Get All from Hubspot (repeated 70x)
├── [Sub] Create Contacts in HS (2%)
└── [Sub] Update Vehicles (50%)
```

### 2B.3 Document Flow Tracker
- [ ] Create `src/lib/analytics/documentFlow.ts`
- [ ] Track document count at each step
- [ ] Detect split operations (1 doc → 100 docs)
- [ ] Detect filter operations (137 docs → 33 docs)
- [ ] Calculate document amplification factor

### 2B.4 Performance Percentile Calculator
- [ ] Create `src/lib/analytics/percentiles.ts`
- [ ] Calculate p50, p75, p90, p95, p99 execution times
- [ ] Identify outliers (times > 3x p95)
- [ ] Group performance by shape type

### 2B.5 Connector Latency Analyzer
- [ ] Create `src/lib/analytics/connectorLatency.ts`
- [ ] Calculate average latency per connector
- [ ] Compare HTTP vs Database connector performance
- [ ] Identify slowest connector operations
- [ ] Track latency trends over time within log

### 2B.6 Environment Detector
- [ ] Create `src/lib/analytics/environmentDetector.ts`
- [ ] Detect `[Prod]` vs `[Sandbox]` patterns in shape names
- [ ] Auto-tag analysis with environment
- [ ] Display environment badge in UI

### 2B.7 Error Pattern Analyzer
- [ ] Create `src/lib/analytics/errorPatterns.ts`
- [ ] Group errors by HTTP status code
- [ ] Detect retry patterns (same call repeated after error)
- [ ] Identify recurring error messages
- [ ] Calculate MTBF (mean time between failures)

### 2B.8 Data Split Analyzer
- [ ] Create `src/lib/analytics/dataSplitAnalyzer.ts`
- [ ] Parse "Split resulted in X document(s)" messages
- [ ] Calculate total documents created by splits
- [ ] Identify large splits (>100 docs per split)

### 2B.9 Summary Metrics Generator
- [ ] Create `src/lib/analytics/summaryGenerator.ts`
- [ ] Generate executive summary from analysis
- [ ] Calculate health score (based on error rate, performance)
- [ ] Identify top 3 performance issues
- [ ] Generate recommendations list

### 2B.10 Comparison Analytics (Future)
- [ ] Create `src/lib/analytics/comparison.ts`
- [ ] Compare two analyses side-by-side
- [ ] Show performance deltas
- [ ] Identify new errors between runs
- [ ] Track improvements over time

---

## Phase 2C: Boomi API Integration (NEW)

**Goal:** Enable live monitoring by integrating Boomi AtomSphere API for automatic log fetching.

> 🔌 This transforms the app from **passive log analyzer** to **active monitoring platform**  
> See `BOOMI_API_INTEGRATION_PLAN.md` for full architectural details

### 2C.1 Boomi API Client Setup
- [ ] Create `src/lib/boomi/client.ts` - Base HTTP client
- [ ] Implement API authentication with token
- [ ] Add retry logic with exponential backoff
- [ ] Implement rate limiting (100 req/min)
- [ ] Add request/response logging
- [ ] Write unit tests for client

**Key features:**
```typescript
class BoomiAPIClient {
  async query(objectType: string, filter: QueryFilter): Promise<T[]>
  async create(objectType: string, data: any): Promise<T>
  async get(objectType: string, id: string): Promise<T>
}
```

### 2C.2 Authentication & Connection Management
- [ ] Create Boomi connection database schema
- [ ] Implement API token encryption (AES-256)
- [ ] Create connection CRUD API endpoints
- [ ] Add connection testing endpoint (`POST /api/boomi/test-connection`)
- [ ] Validate credentials against Boomi API
- [ ] Handle token expiration gracefully

**Database schema:**
```prisma
model BoomiConnection {
  id        String @id
  userId    String
  accountId String
  username  String
  apiToken  String @encrypted
  isActive  Boolean
}
```

### 2C.3 ExecutionRecord Integration
- [ ] Create `src/lib/boomi/executionRecords.ts`
- [ ] Implement query with filters (date, status, process)
- [ ] Add pagination support for large result sets
- [ ] Create API endpoint: `GET /api/boomi/executions`
- [ ] Parse execution metadata into standard format
- [ ] Write integration tests with mock API

**Query capabilities:**
- Filter by date range (last 24h, 7d, 30d, custom)
- Filter by status (Success, Error, Canceled, All)
- Filter by process name/ID
- Sort by execution time

### 2C.4 ProcessLog Integration
- [ ] Create `src/lib/boomi/processLogs.ts`
- [ ] Implement async log request (CREATE ProcessLog)
- [ ] Add polling mechanism to check log readiness
- [ ] Download log file from returned URL
- [ ] Stream large logs to disk (>20MB support)
- [ ] Create API endpoint: `POST /api/boomi/fetch-log`
- [ ] Add progress tracking for UI updates

**Workflow:**
```typescript
1. Request log creation → returns processLogId
2. Poll status every 2s (max 30s timeout)
3. When READY → download from URL
4. Pass to existing parser
5. Return enriched analysis
```

### 2C.5 Component Metadata Integration
- [ ] Create `src/lib/boomi/componentMetadata.ts`
- [ ] Query component metadata for connectors
- [ ] Implement metadata caching (24h expiry)
- [ ] Create cache refresh endpoint
- [ ] Enrich analysis results with component details
- [ ] Create API endpoint: `GET /api/boomi/components/:id`

**Enrichment data:**
- Connector name and type
- Component folder/category
- Created/modified timestamps
- Creator information

### 2C.6 API Error Handling
- [ ] Handle network errors gracefully
- [ ] Parse Boomi API error responses
- [ ] Implement friendly error messages
- [ ] Add retry for transient failures
- [ ] Log errors for debugging
- [ ] Return structured error responses

**Common errors:**
- Invalid credentials (401)
- Rate limit exceeded (429)
- Resource not found (404)
- Server errors (5xx)

### 2C.7 Rate Limiting & Quotas
- [ ] Implement request queue system
- [ ] Track API usage per connection
- [ ] Show remaining quota in UI
- [ ] Warn user when approaching limits
- [ ] Implement backoff when limit hit

**Boomi limits:**
- 100 requests/minute per account
- 5 concurrent requests
- Log download size limits

### 2C.8 Background Job System
- [ ] Set up job queue (BullMQ or similar)
- [ ] Create job for scheduled log fetching
- [ ] Implement cron-based scheduling
- [ ] Add job status tracking
- [ ] Create job management API endpoints

**Job types:**
- Scheduled execution monitoring
- Automatic log analysis
- Component metadata refresh

### 2C.9 Notification System
- [ ] Create email notification templates
- [ ] Implement email sender (Nodemailer)
- [ ] Add notification preferences model
- [ ] Send alerts for error executions
- [ ] Create notification history

**Notifications for:**
- Process execution errors
- Scheduled analysis completion
- Performance degradation alerts

### 2C.10 Execution Comparison
- [ ] Fetch previous execution for same process
- [ ] Compare performance metrics
- [ ] Identify new/resolved errors
- [ ] Calculate performance delta %
- [ ] Display comparison in analysis results

### 2C.11 Audit Logging
- [ ] Log all API interactions
- [ ] Track which user fetched which executions
- [ ] Record failed authentication attempts
- [ ] Create audit log viewer (admin only)

### 2C.12 Integration Testing
- [ ] Test full fetch-analyze workflow
- [ ] Test connection management flow
- [ ] Test scheduled job execution
- [ ] Test notification delivery
- [ ] Load test with multiple concurrent requests
- [ ] Test error scenarios (network failure, invalid token, etc.)

---

## Phase 3: User Interface

**Goal:** Build all frontend components for the analysis workflow with enhanced visualizations.

### 3.1 File Upload Component
- [ ] Create `src/components/common/FileUploader.tsx`
- [ ] Implement drag-and-drop zone
- [ ] Show file selection via click
- [ ] Display selected file name and size
- [ ] Show upload progress indicator
- [ ] Handle file validation errors
- [ ] **NEW:** Show estimated processing time for large files (>10MB)

### 3.2 Upload Page
- [ ] Create `src/app/(dashboard)/analyze/page.tsx`
- [ ] Add FileUploader component
- [ ] Add "Number of results" option input
- [ ] Add "Analyze" submit button
- [ ] Handle form submission state

### 3.3 Loading State (Enhanced)
- [ ] Create `src/components/common/LoadingSpinner.tsx`
- [ ] Add animated spinner CSS
- [ ] Show loading message during analysis
- [ ] **NEW:** Show progress bar with percentage for large files
- [ ] **NEW:** Show "Processing line X of Y" during parsing

### 3.4 Results Summary Card (Enhanced)
- [ ] Create `src/components/analysis/ResultsSummary.tsx`
- [ ] Display total execution time (duration)
- [ ] Show file information (size, lines, start/end time)
- [ ] Display count of steps, warnings, errors
- [ ] **NEW:** Show main process name
- [ ] **NEW:** Display error rate percentage with color coding
- [ ] **NEW:** Show document count processed
- [ ] **NEW:** Display environment badge (Prod/Sandbox)

### 3.5 Execution Times Table (Enhanced)
- [ ] Create `src/components/analysis/ExecutionTimesTable.tsx`
- [ ] Display rank, time, shape name, line number
- [ ] Make table sortable by column
- [ ] Add copy-to-clipboard for shape names
- [ ] Style slow times (> 1 second) with warning color
- [ ] **NEW:** Add shape type icon/badge
- [ ] **NEW:** Add pagination for tables with >50 rows

### 3.6 Execution Times Chart
- [ ] Install Recharts: `npm install recharts`
- [ ] Create `src/components/analysis/ExecutionTimesChart.tsx`
- [ ] Create horizontal bar chart of top times
- [ ] Add hover tooltips with details
- [ ] Make chart responsive

### 3.7 Process Flow Visualization (Enhanced)
- [ ] Install D3: `npm install d3 @types/d3`
- [ ] Create `src/components/analysis/ProcessFlowChart.tsx`
- [ ] Render steps as nodes
- [ ] Connect steps with arrows
- [ ] Color-code by execution time
- [ ] Add zoom and pan controls
- [ ] Show tooltips on hover
- [ ] **NEW:** Show subprocess hierarchy with collapsible branches
- [ ] **NEW:** Highlight error nodes in red

### 3.8 Warnings Sidebar (Enhanced)
- [ ] Create `src/components/analysis/WarningsSidebar.tsx`
- [ ] List warnings with severity indicator
- [ ] Sort SEVERE before WARNING
- [ ] Show timestamp and component
- [ ] Make collapsible/expandable
- [ ] **NEW:** Group errors by HTTP status code
- [ ] **NEW:** Add filter by error type

### 3.9 Connector Usage Dashboard (NEW)
- [ ] Create `src/components/analysis/ConnectorDashboard.tsx`
- [ ] Show pie chart of connector call distribution
- [ ] Display average latency per connector
- [ ] Highlight slow connectors (avg > 500ms)
- [ ] List top connector operations

### 3.10 Shape Type Distribution Chart (NEW)
- [ ] Create `src/components/analysis/ShapeDistributionChart.tsx`
- [ ] Show bar chart of shape type counts
- [ ] Display percentage of total
- [ ] Highlight dominant shape types

### 3.11 Error Timeline (NEW)
- [ ] Create `src/components/analysis/ErrorTimeline.tsx`
- [ ] Show timeline of when errors occurred during execution
- [ ] Overlay on execution duration
- [ ] Click to jump to error details
- [ ] Color-code by HTTP status category (4xx, 5xx)

### 3.12 Process Hierarchy Tree (NEW)
- [ ] Create `src/components/analysis/ProcessHierarchyTree.tsx`
- [ ] Show main process and subprocesses as tree
- [ ] Display time percentage per subprocess
- [ ] Collapsible/expandable branches
- [ ] Click to filter results by subprocess

### 3.13 Export Functionality
- [ ] Add "Export JSON" button
- [ ] Add "Export CSV" button
- [ ] Generate downloadable files from results
- [ ] Include all analysis data in export
- [ ] **NEW:** Add "Export PDF Report" option

### 3.14 Error Handling UI
- [ ] Create `src/components/common/ErrorMessage.tsx`
- [ ] Style error messages prominently
- [ ] Add retry button where appropriate
- [ ] Handle network errors gracefully

### 3.15 Responsive Design
- [ ] Test on mobile viewport (375px)
- [ ] Test on tablet viewport (768px)
- [ ] Test on desktop viewport (1200px+)
- [ ] Fix layout issues at each breakpoint
- [ ] Ensure touch-friendly interactions

### 3.16 Dark Mode Support
- [ ] Define dark mode CSS variables
- [ ] Add theme toggle component
- [ ] Store preference in localStorage
- [ ] Respect system preference by default

---

## Phase 4: Authentication and Persistence

**Goal:** Add user accounts and save analysis history.

### 4.1 NextAuth.js Setup
- [ ] Install NextAuth: `npm install next-auth`
- [ ] Create `src/app/api/auth/[...nextauth]/route.ts`
- [ ] Configure credentials provider
- [ ] Create `src/lib/auth/options.ts` for configuration
- [ ] Add NEXTAUTH_SECRET to environment

### 4.2 Registration Page
- [ ] Create `src/app/(auth)/register/page.tsx`
- [ ] Add email and password form fields
- [ ] Add confirm password field
- [ ] Implement client-side validation
- [ ] Call registration API on submit

### 4.3 Login Page
- [ ] Create `src/app/(auth)/login/page.tsx`
- [ ] Add email and password fields
- [ ] Show error messages for failed login
- [ ] Redirect to dashboard on success

### 4.4 Password Hashing
- [ ] Install bcrypt: `npm install bcryptjs @types/bcryptjs`
- [ ] Hash passwords on registration
- [ ] Verify passwords on login
- [ ] Never store or log plain passwords

### 4.5 Session Management
- [ ] Create middleware for protected routes
- [ ] Redirect unauthenticated users to login
- [ ] Pass session to server components
- [ ] Access session in client components

### 4.6 Save Analysis Results
- [ ] Modify analyze API to save to database
- [ ] Associate analysis with logged-in user
- [ ] Store all result data as JSON fields
- [ ] Record timestamp and file metadata

### 4.7 Analysis History Page
- [ ] Create `src/app/(dashboard)/history/page.tsx`
- [ ] Fetch user's analyses from database
- [ ] Display list with date, filename, summary
- [ ] Add pagination if many results
- [ ] Link to individual analysis pages

### 4.8 Analysis Detail Page
- [ ] Create `src/app/(dashboard)/analysis/[id]/page.tsx`
- [ ] Fetch single analysis by ID
- [ ] Verify user owns the analysis
- [ ] Display all visualizations from saved data
- [ ] Add back button to history

### 4.9 Delete Analysis
- [ ] Add delete button to analysis pages
- [ ] Create DELETE API endpoint
- [ ] Add confirmation dialog
- [ ] Remove from database on confirm

### 4.10 User Profile Page
- [ ] Create `src/app/(dashboard)/profile/page.tsx`
- [ ] Display user email and registration date
- [ ] Allow name update
- [ ] Show total analyses count

### 4.11 Logout Functionality
- [ ] Add logout button to header
- [ ] Clear session on logout
- [ ] Redirect to home page

---

## Phase 3B: Monitoring Dashboard UI (NEW)

**Goal:** Build user interface for live Boomi execution monitoring and API management.

> 🎨 This phase provides the frontend for Phase 2C API integration  
> Enables users to monitor Boomi executions without manual log upload

### 3B.1 Connection Setup Page
- [ ] Create `src/app/(dashboard)/settings/boomi/page.tsx`
- [ ] Form to add new Boomi API connection
- [ ] Input fields: Account ID, Username, API Token
- [ ] Connection name for multiple accounts
- [ ] "Test Connection" button with loading state
- [ ] Visual feedback on successful/failed test
- [ ] List of existing connections with edit/delete
- [ ] Mark connection as active/inactive

**UI Features:**
- Masked API token display (••••••••)
- Copy connection ID to clipboard
- Last used timestamp
- Connection status indicator

### 3B.2 Live Monitoring Dashboard
- [ ] Create `src/app/(dashboard)/monitor/page.tsx`
- [ ] Connection selector dropdown (if multiple)
- [ ] Execution list table with columns:
  - Process Name
  - Execution Status (✅❌⚠️)
  - Start Time (relative: "2h ago")
  - Duration
  - Action buttons
- [ ] Auto-refresh toggle (every 30s, 1min, 5min)
- [ ] Manual refresh button
- [ ] "Analyze" button per execution row

**Filters:**
```typescript
- Status: All | Success | Error | Canceled
- Date Range: Last 24h | 7d | 30d | Custom
- Process: All | Select specific process
- Sort: Newest first | Oldest first | Longest duration
```

### 3B.3 Execution Quick Actions
- [ ] Click row to expand details
- [ ] Show execution metadata in expandable row:
  - Execution ID
  - Process ID
  - Execution Mode (Test/Prod/Manual)
  - Triggered by (from audit log)
  - Error message if failed
- [ ] "Analyze Now" button (fetches log + analyzes)
- [ ] "View in Boomi" link (deep link to Boomi UI)
- [ ] Loading state during log fetch

### 3B.4 Log Fetch Progress
- [ ] Show progress modal during log fetch
- [ ] Progress stages:
  1. Requesting log from Boomi
  2. Waiting for log to be ready (polling)
  3. Downloading log file
  4. Parsing and analyzing
- [ ] Progress bar with percentage
- [ ] Cancel button (abort fetch)
- [ ] Error handling with retry option

### 3B.5 Enriched Analysis View
- [ ] Extend existing analysis results component
- [ ] Add "Execution Info" card at top:
  - Process name from Boomi
  - Execution status badge
  - Execution mode badge
  - Link to execution in monitor
- [ ] Show "Compare with Previous" button
- [ ] Display component metadata tooltips

### 3B.6 Scheduled Analysis Setup
- [ ] Create `src/app/(dashboard)/monitor/scheduled/page.tsx`
- [ ] Form to create new scheduled job
- [ ] Fields:
  - Job name
  - Process selector (All or specific)
  - Schedule (cron expression builder)
  - Analysis options (only errors, min duration)
  - Notification settings
- [ ] List existing jobs with enable/disable toggle
- [ ] Show last/next run times
- [ ] Manual "Run Now" button

### 3B.7 Notification Preferences
- [ ] Add notification settings section
- [ ] Email address for alerts
- [ ] Notification triggers checkboxes
- [ ] Sample email preview
- [ ] Test notification button

### 3B.8 Execution Comparison View
- [ ] Create comparison modal/page
- [ ] Side-by-side execution metadata
- [ ] Performance delta visualization
- [ ] Highlight new/resolved errors
- [ ] Timeline comparison graph

### 3B.9 Connection Health Dashboard
- [ ] Create connection health widget
- [ ] Show API usage metrics
- [ ] Remaining quota warning
- [ ] Connection status indicator

### 3B.10 Real-time Updates (Optional)
- [ ] Set up WebSocket for live updates
- [ ] Push new executions without refresh
- [ ] Toast notifications for errors
- [ ] Browser desktop notifications

---

## Phase 5: Deployment and Polish

**Goal:** Deploy to production and add final refinements.

### 5.1 Create Dockerfile
- [ ] Create multi-stage Dockerfile
- [ ] Stage 1: Install dependencies
- [ ] Stage 2: Build application
- [ ] Stage 3: Production image (minimal)
- [ ] Optimize for small image size

**Dockerfile template:**
```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]
```

### 5.2 Docker Compose Production Setup
- [ ] Create `docker-compose.prod.yml`
- [ ] Configure app service with production settings
- [ ] Configure PostgreSQL with persistent volume
- [ ] Set up environment variables from secrets
- [ ] Configure health checks

### 5.3 Environment Configuration
- [ ] Document all required environment variables
- [ ] Create `.env.example` template
- [ ] Set up secrets in Coolify
- [ ] Verify no secrets in source code

**Required environment variables:**
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<random-string>
```

### 5.4 Coolify Deployment
- [ ] Connect GitHub repository to Coolify
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Configure domain/subdomain
- [ ] Test deployment process

### 5.5 SSL/HTTPS Setup
- [ ] Configure Let's Encrypt in Coolify
- [ ] Verify HTTPS works correctly
- [ ] Check for mixed content issues
- [ ] Test certificate renewal

### 5.6 Performance Review
- [ ] Test page load times with Lighthouse
- [ ] Optimize largest contentful paint (LCP)
- [ ] Check cumulative layout shift (CLS)
- [ ] Optimize bundle size if needed

### 5.7 Security Review
- [ ] Check for exposed secrets in code
- [ ] Verify authentication works correctly
- [ ] Test authorization (can't access others' data)
- [ ] Check for common vulnerabilities (XSS, CSRF)
- [ ] Set appropriate HTTP headers

### 5.8 SEO Optimization
- [ ] Add page titles for all routes
- [ ] Add meta descriptions
- [ ] Create sitemap.xml
- [ ] Add Open Graph tags for sharing
- [ ] Check robots.txt

### 5.9 Landing Page
- [ ] Create public homepage at `/`
- [ ] Explain what the application does
- [ ] Show sample screenshots
- [ ] Add call-to-action buttons
- [ ] Link to login/register

### 5.10 Final Testing
- [ ] Complete walkthrough as new user
- [ ] Test on different browsers (Chrome, Firefox, Safari)
- [ ] Verify all features work in production
- [ ] Check error handling in production
- [ ] Get feedback from test users

---

## Post-Implementation: Thesis Writing

After implementation is complete, allocate time for thesis documentation:

### Documentation Tasks
- [ ] Write Introduction chapter
- [ ] Write Background and Literature Review
- [ ] Document methodology used
- [ ] Describe technical architecture with diagrams
- [ ] Explain implementation decisions
- [ ] Document testing results
- [ ] Write evaluation and discussion
- [ ] Prepare conclusion and future work
- [ ] Create appendices (code samples, screenshots)
- [ ] Review and edit full document
- [ ] Format according to institution guidelines
- [ ] Prepare presentation slides
- [ ] Practice demo and presentation

---

## Notes and Progress Log

Use this section to track progress, blockers, and decisions:

### Week 1 Notes
_Add notes here as you progress..._

### Week 2 Notes
_Add notes here as you progress..._

### Week 3 Notes
_Add notes here as you progress..._

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [D3.js Documentation](https://d3js.org)
- [Recharts Documentation](https://recharts.org)
- [Coolify Documentation](https://coolify.io/docs)

---

## Log Analysis Reference

Based on analysis of real Boomi log file (21MB, 205K lines):

### Log Format (Tab-Separated)
```
TIMESTAMP\tLOG_LEVEL\tSHAPE_NAME\tCOMPONENT\tMESSAGE
```

### Example Log Lines
```
# Shape execution
2025-10-20T06:30:01Z\tINFO\tConnector\t[Common] HTTP.01 HubSpot API\tShape executed successfully in 422 ms.

# Error
2025-10-20T07:26:00Z\tSEVERE\tConnector\t[Common] HTTP.01 HubSpot API\tError message received from Http Server, Code 409: Conflict

# Warning from script
2025-10-20T06:30:01Z\tWARNING\tFind Latest Timestamp\t[1] Scripting: groovy2\tOld _LastTS: 2025-10-19. New LastTS: 2025-10-20.

# Subprocess call
2025-10-20T06:30:01Z\tINFO\tProcess Call\tpassing in start data\tExecuting process [Sub] Get All from Hubspot
```

### Key Regex Patterns
```typescript
// Execution time extraction
const EXEC_TIME = /(\d+)\s+ms\./;

// Document count
const DOC_COUNT = /with\s+(\d+)\s+document\(s\)/;

// HTTP error codes
const HTTP_ERROR = /Code\s+(\d{3}):\s+(.+)/;

// Connector parsing
const CONNECTOR = /\[Common\]\s+([^:]+):\s*([^;]+)(?:;\s*(.+))?/;

// Process name
const PROCESS = /Executing\s+Process\s+(.+?)(?:\s+\(Continuation|$)/;

// Fiber continuation (pagination detection)
const FIBER = /Continuation\s+(f_[\d_]+)/;

// Environment detection
const ENVIRONMENT = /\[(Prod|Sandbox|Dev)\]/i;
```

See `LOG_ANALYSIS_INSIGHTS.md` for complete analysis findings.
