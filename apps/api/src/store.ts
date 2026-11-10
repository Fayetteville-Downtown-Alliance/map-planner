import { DatabaseSync } from 'node:sqlite'
import { PlannerStore as CoreStore } from './planner-store'
export { StoreError } from './planner-store'
/** Original loopback adapter, also used by Node-based API/client tests. */
export class PlannerStore extends CoreStore {
  constructor(path: string) {
    const db = new DatabaseSync(path)
    db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;')
    super({
      exec(query) { db.exec(query) }, prepare(query) { return db.prepare(query) }, close() { db.close() },
      transaction(work) {
        db.exec('BEGIN IMMEDIATE')
        try { const result = work(); db.exec('COMMIT'); return result }
        catch (error) { db.exec('ROLLBACK'); throw error }
      },
    })
  }
}
