# Scalability Stress Analysis: E-Kost 100 → 100,000 Users

## A) Scalability Stress Map

| Data Flow | Breaks First | Bottleneck Location | Failure Mode | Immediate Mitigation | Long-Term Fix |
|----------|--------------|---------------------|-------------|----------------------|--------------|
| Tenant List → Load All Tenants → DB Query | Database | PostgreSQL connection pool | Connection pool exhaustion, slow full table scan | Add pagination (LIMIT/OFFSET), connection pooling, indexes on created_at | Read replicas, tenant list caching, cursor-based pagination |
| Outstanding Balance Calculation → Join Tenants+Rooms+Payments → DB | Database | PostgreSQL query execution | N+1 queries, expensive JOINs across 3 tables | Materialized view for balances, query optimization, indexes | Event-driven balance updates, denormalized balance table |
| Payment Recording → Insert Payment → Recalculate Balance → DB | Database | PostgreSQL write + calculation | Transaction contention, synchronous balance recalc | Async balance calculation, optimistic locking | Event queue for balance updates, CQRS pattern |
| Tenant Assignment → Update Room Status → Update Tenant → DB | Database | PostgreSQL transaction locks | Row-level locking on room updates | Shorter transactions, retry logic | Event sourcing for state changes, optimistic concurrency |
| Payment List View → Load All Payments → DB Query | Database | PostgreSQL full table scan | Memory pressure from large result sets | Pagination, date range filters, indexes | Partitioned payments table by date, read replicas |
| Room List with Status → Load All Rooms → DB Query | Database | PostgreSQL connection pool | Connection exhaustion on concurrent requests | Connection pooling, room status caching | Redis cache for room status, eventual consistency |
| Mobile UI → Load Tenant Details → Outstanding Balance Calc | API/Service | Application server CPU | Synchronous balance calculation blocking threads | Cache balance results, async calculation | Background job for balance updates, WebSocket for real-time |
| Tenant Search/Filter → LIKE queries → DB | Database | PostgreSQL sequential scan | Full table scan on text fields | Full-text search indexes (GIN), query limits | Elasticsearch for search, denormalized search table |
| Payment History per Tenant → JOIN payments+tenants → DB | Database | PostgreSQL query performance | Expensive JOINs on large payment table | Composite indexes, query optimization | Separate payment service, event log for history |
| Room Assignment Validation → Check Room Availability → DB | Database | PostgreSQL read consistency | Race conditions on concurrent assignments | SELECT FOR UPDATE, transaction isolation | Distributed locks, event-driven room state |
| Bulk Payment Import → Multiple INSERTs → DB | Database | PostgreSQL write throughput | Lock contention, transaction log pressure | Batch inserts, prepared statements | Message queue for async processing, bulk load APIs |
| Translation Loading → File I/O → Application Memory | API/Service | File system + memory | File I/O blocking, memory usage for large translations | Cache translations in memory, lazy loading | CDN for translation files, database-backed i18n |

---

## B) Proposed Improvements

### 1. Events to Introduce

**PaymentRecorded Event**
- Producer: PaymentService
- Consumers: BalanceCalculationService, AuditLogService
- Payload: `{tenantId, paymentId, amount, date, timestamp}`

**TenantAssigned Event**
- Producer: TenantService
- Consumers: RoomService, BalanceCalculationService
- Payload: `{tenantId, roomId, assignmentDate, timestamp}`

**RoomStatusChanged Event**
- Producer: RoomService
- Consumers: TenantService, NotificationService (future)
- Payload: `{roomId, oldStatus, newStatus, timestamp}`

**BalanceCalculated Event**
- Producer: BalanceCalculationService
- Consumers: NotificationService (future), ReportingService (future)
- Payload: `{tenantId, outstandingBalance, calculatedAt}`

### 2. Queues / Job System

**Balance Calculation Queue**
- Jobs: Recalculate balance for tenant after payment/assignment changes
- Retry Strategy: Exponential backoff, max 3 retries
- Idempotency Key: `balance-calc-{tenantId}-{timestamp}`
- Processing: Background workers, 2-second SLA

**Audit Log Queue**
- Jobs: Record all CRUD operations for compliance
- Retry Strategy: Dead letter queue after 5 failures
- Idempotency Key: `audit-{entityType}-{entityId}-{operation}-{timestamp}`
- Processing: Async, eventual consistency acceptable

**Bulk Import Queue**
- Jobs: Process CSV uploads for payments/tenants
- Retry Strategy: Manual retry with error reporting
- Idempotency Key: `import-{fileHash}-{userId}`
- Processing: Chunked processing, progress tracking

### 3. Caching Plan

**Tenant List Cache**
- Cache Key: `tenant-list-{page}-{filter}`
- TTL: 5 minutes
- Invalidation: On tenant create/update/delete events
- Storage: Redis with pagination support

**Outstanding Balance Cache**
- Cache Key: `balance-{tenantId}`
- TTL: 1 hour (refreshed on payment events)
- Invalidation: On PaymentRecorded, TenantAssigned events
- Storage: Redis with atomic updates

**Room Status Cache**
- Cache Key: `room-status-{roomId}` and `available-rooms`
- TTL: 10 minutes
- Invalidation: On RoomStatusChanged, TenantAssigned events
- Storage: Redis with set operations for filtering

**Translation Cache**
- Cache Key: `translations-{locale}`
- TTL: 24 hours
- Invalidation: On file modification (webhook/polling)
- Storage: Application memory + Redis backup

### 4. Database Optimizations

**Indexes to Add**
```sql
-- Tenant queries
CREATE INDEX idx_tenants_created_at ON tenants(created_at DESC);
CREATE INDEX idx_tenants_room_id ON tenants(room_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_search ON tenants USING GIN(to_tsvector('english', name || ' ' || email));

-- Payment queries  
CREATE INDEX idx_payments_tenant_date ON payments(tenant_id, payment_date DESC);
CREATE INDEX idx_payments_date ON payments(payment_date DESC);
CREATE INDEX idx_payments_tenant_id ON payments(tenant_id);

-- Room queries
CREATE INDEX idx_rooms_status ON rooms(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_rooms_available ON rooms(id) WHERE status = 'available';

-- Outstanding balance materialized view
CREATE MATERIALIZED VIEW tenant_balances AS
SELECT 
    t.id as tenant_id,
    t.name,
    r.monthly_rent,
    COALESCE(SUM(p.amount), 0) as total_payments,
    r.monthly_rent - COALESCE(SUM(p.amount), 0) as outstanding_balance
FROM tenants t
LEFT JOIN rooms r ON t.room_id = r.id
LEFT JOIN payments p ON t.id = p.tenant_id
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.name, r.monthly_rent;

CREATE UNIQUE INDEX idx_tenant_balances_tenant_id ON tenant_balances(tenant_id);
```

**Query Optimizations**
- Replace N+1 queries with batch loading
- Use prepared statements for frequent queries
- Implement cursor-based pagination for large lists
- Add query timeouts and connection limits

**Read Replicas**
- Route all read queries to read replicas
- Use primary only for writes and real-time balance calculations
- Implement read-after-write consistency for critical flows

**Partitioning Strategy**
- Partition payments table by month: `payments_2024_01`, `payments_2024_02`
- Partition audit logs by date range
- Consider tenant-based partitioning for multi-property future

### 5. Observability

**Key Metrics to Track**
- Database connection pool utilization
- Query execution times (P95, P99)
- Outstanding balance calculation latency
- Cache hit rates for tenant lists and balances
- API response times by endpoint
- Queue depth and processing times
- Memory usage for translation loading

**Dashboards**
- Real-time performance dashboard (response times, error rates)
- Database performance dashboard (slow queries, connection usage)
- Business metrics dashboard (tenant growth, payment volume)
- Cache performance dashboard (hit rates, eviction rates)

**Critical Alerts**
- Database connection pool > 80% utilization
- Outstanding balance calculation > 5 seconds
- Payment recording failures
- Cache miss rate > 50% for tenant lists
- Queue depth > 1000 items
- API error rate > 5%
- Memory usage > 85%

**Health Checks**
- Database connectivity and query performance
- Cache connectivity and basic operations
- Queue system health and processing capacity
- Translation file accessibility and loading time

---

## Implementation Priority

### Phase 1: Immediate (Week 1-2)
1. Add database indexes for common queries
2. Implement pagination for tenant and payment lists
3. Add connection pooling and query timeouts
4. Cache outstanding balance calculations

### Phase 2: Short-term (Week 3-6)
1. Implement event-driven balance calculation
2. Add Redis caching for tenant lists and room status
3. Create materialized view for outstanding balances
4. Add read replicas for query scaling

### Phase 3: Medium-term (Month 2-3)
1. Implement full event sourcing for audit trail
2. Add message queues for async processing
3. Partition payments table by date
4. Implement bulk import processing

### Phase 4: Long-term (Month 4-6)
1. CQRS pattern for read/write separation
2. Elasticsearch for advanced search
3. Multi-region deployment for global scale
4. Advanced caching strategies with cache warming