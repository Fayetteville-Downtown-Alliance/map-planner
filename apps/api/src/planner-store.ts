import { createHash, randomUUID } from 'node:crypto'
import { emptyPlan, regions, validatePlan, type EventInput, type EventRecord, type Plan } from '@map-planner/domain'

export class StoreError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}
export type SqlValue = string | number | null
export interface PlannerDatabase {
  exec(query: string): void
  prepare(query: string): {
    all(...values: SqlValue[]): Record<string, unknown>[]
    get(...values: SqlValue[]): Record<string, unknown> | undefined
    run(...values: SqlValue[]): { changes: number | bigint }
  }
  transaction<T>(work: () => T): T
  close(): void
}
export class PlannerStore {
  constructor(private db: PlannerDatabase, private limits = { events: 500, operations: 10000 }) {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS events (
        organization_id TEXT NOT NULL, id TEXT NOT NULL, title TEXT NOT NULL,
        event_date TEXT NOT NULL, region_id TEXT NOT NULL,
        revision INTEGER NOT NULL CHECK(revision>=0),
        plan TEXT NOT NULL CHECK(json_valid(plan)), publication TEXT CHECK(publication IS NULL OR json_valid(publication)),
        PRIMARY KEY(organization_id,id)
      );
      CREATE TABLE IF NOT EXISTS plan_versions (
        organization_id TEXT NOT NULL, event_id TEXT NOT NULL, revision INTEGER NOT NULL,
        snapshot TEXT NOT NULL CHECK(json_valid(snapshot)),
        PRIMARY KEY(organization_id,event_id,revision),
        FOREIGN KEY(organization_id,event_id) REFERENCES events(organization_id,id)
      );
      CREATE TABLE IF NOT EXISTS operations (
        organization_id TEXT NOT NULL, operation_id TEXT NOT NULL, request_hash TEXT NOT NULL,
        result TEXT NOT NULL CHECK(json_valid(result)), PRIMARY KEY(organization_id,operation_id)
      );
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY, organization_id TEXT NOT NULL, event_id TEXT NOT NULL,
        actor_id TEXT NOT NULL, action TEXT NOT NULL, revision INTEGER NOT NULL, created_at TEXT NOT NULL
      );
      INSERT OR IGNORE INTO schema_migrations(version) VALUES (1);`)
  }
  close() { this.db.close() }
  list(org: string): EventRecord[] {
    return this.db.prepare('SELECT id FROM events WHERE organization_id=? ORDER BY event_date,id').all(org).map(row => this.get(org, String(row.id)))
  }
  get(org: string, id: string): EventRecord {
    const row = this.db.prepare('SELECT id,title,event_date,region_id,revision,plan,publication FROM events WHERE organization_id=? AND id=?').get(org, id)
    if (!row) throw new StoreError(404, 'not_found', 'This event is not available in this workspace.')
    return { id: String(row.id), organizationId: org, title: String(row.title), date: String(row.event_date), regionId: String(row.region_id), revision: Number(row.revision),
      plan: JSON.parse(String(row.plan)) as Plan, publication: row.publication ? JSON.parse(String(row.publication)) : null }
  }
  receipt(org: string, operationId: string): EventRecord {
    const row = this.db.prepare('SELECT result FROM operations WHERE organization_id=? AND operation_id=?').get(org, operationId)
    if (!row) throw new StoreError(404, 'receipt_not_found', 'No accepted operation was found. Keep your draft and retry with the same operation ID.')
    return JSON.parse(String(row.result)) as EventRecord
  }
  command(org: string, operationId: string, request: unknown, work: () => EventRecord): EventRecord {
    const hash = createHash('sha256').update(JSON.stringify(request)).digest('hex')
    return this.db.transaction(() => {
      const prior = this.db.prepare('SELECT request_hash,result FROM operations WHERE organization_id=? AND operation_id=?').get(org, operationId)
      if (prior) {
        if (prior.request_hash !== hash) throw new StoreError(409, 'operation_reused', 'This operation ID was already used with different content.')
        return JSON.parse(String(prior.result)) as EventRecord
      }
      const count = this.db.prepare('SELECT count(*) AS count FROM operations WHERE organization_id=?').get(org)
      if (Number(count?.count) >= this.limits.operations) throw new StoreError(429, 'preview_limit', 'This demonstration workspace has reached its operation limit.')
      const result = work()
      this.db.prepare('INSERT INTO operations(organization_id,operation_id,request_hash,result) VALUES (?,?,?,?)').run(org, operationId, hash, JSON.stringify(result))
      return result
    })
  }
  create(org: string, operationId: string, input: EventInput): EventRecord {
    if (!regions.some(r => r.id === input.regionId)) throw new StoreError(400, 'unknown_region', 'Choose a demonstration region.')
    return this.command(org, operationId, { action: 'create', input }, () => {
      const count = this.db.prepare('SELECT count(*) AS count FROM events WHERE organization_id=?').get(org)
      if (Number(count?.count) >= this.limits.events) throw new StoreError(429, 'preview_limit', 'This demonstration workspace has reached its event limit.')
      const id = randomUUID()
      this.db.prepare('INSERT INTO events(organization_id,id,title,event_date,region_id,revision,plan) VALUES (?,?,?,?,?,0,?)')
        .run(org, id, input.title, input.date, input.regionId, JSON.stringify(emptyPlan()))
      return this.record(org, id, 'event.create')
    })
  }
  update(org: string, id: string, operationId: string, expectedRevision: number, action: 'save' | 'publish' | 'withdraw', input?: unknown): EventRecord {
    return this.command(org, operationId, { action, id, expectedRevision, input }, () => {
      const event = this.get(org, id)
      if (event.revision !== expectedRevision) throw new StoreError(409, 'revision_conflict', 'This event changed elsewhere. Your draft is still here. Load the latest saved version to compare.')
      let publication = event.publication
      let plan = event.plan
      if (action === 'save') plan = validatePlan(input, regions.find(r => r.id === event.regionId)!.timeZone, regions.find(r => r.id === event.regionId)!)
      if (action === 'publish') {
        if (!plan.entries.some(item => item.status !== 'cancelled')) throw new StoreError(400, 'no_active_restrictions', 'Save at least one active restriction before publishing.')
        publication = { version: event.revision + 1, publishedAt: new Date().toISOString(), plan: structuredClone(plan) }
      }
      if (action === 'withdraw') publication = null
      // Saved drafts do not change or implicitly withdraw an existing reviewed snapshot.
      const result = this.db.prepare('UPDATE events SET plan=?,publication=?,revision=revision+1 WHERE organization_id=? AND id=? AND revision=?')
        .run(JSON.stringify(plan), publication ? JSON.stringify(publication) : null, org, id, expectedRevision)
      if (!result.changes) throw new StoreError(409, 'revision_conflict', 'The event changed. Keep your draft and compare the latest version.')
      return this.record(org, id, `plan.${action}`)
    })
  }
  private record(org: string, id: string, action: string): EventRecord {
    const event = this.get(org, id)
    this.db.prepare('INSERT INTO plan_versions(organization_id,event_id,revision,snapshot) VALUES (?,?,?,?)').run(org, id, event.revision, JSON.stringify(event))
    this.db.prepare('INSERT INTO audit_events(id,organization_id,event_id,actor_id,action,revision,created_at) VALUES (?,?,?,?,?,?,?)')
      .run(randomUUID(), org, id, 'local-sandbox', action, event.revision, new Date().toISOString())
    return event
  }
  seed() {
    if (!this.list('sandbox').length) this.create('sandbox', 'seed-event-v1', { title: 'Demonstration street festival', date: '2026-11-20', regionId: 'demo-east' })
  }
}
