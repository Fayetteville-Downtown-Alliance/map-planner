import { DurableObject } from 'cloudflare:workers'
import { PlannerStore, type PlannerDatabase } from '../../api/src/planner-store'
import { createApp } from '../../api/src/app'
import { lifetimeSeconds } from './session'

export class PreviewWorkspace extends DurableObject<Cloudflare.Env> {
  private store: PlannerStore
  private app: ReturnType<typeof createApp>
  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env)
    const sql = ctx.storage.sql
    const db: PlannerDatabase = {
      exec(query) { sql.exec(query) }, close() {},
      prepare(query) { return {
        all(...values) { return sql.exec(query, ...values).toArray() },
        get(...values) { return sql.exec(query, ...values).toArray()[0] },
        run(...values) { const cursor = sql.exec(query, ...values); return { changes: cursor.rowsWritten } },
      } },
      transaction(work) { return ctx.storage.transactionSync(work) },
    }
    this.store = new PlannerStore(db, { events: 30, operations: 1000 })
    this.app = createApp(this.store, { sandbox: true, hostedPreview: true, buildRevision: env.BUILD_REVISION })
    ctx.blockConcurrencyWhile(async () => {
      const expiresAt = await ctx.storage.get<number>('expiresAt') ?? Date.now() + lifetimeSeconds * 1000
      await ctx.storage.put('expiresAt', expiresAt)
      await ctx.storage.setAlarm(expiresAt)
      this.store.seed()
    })
  }
  async handle(request: Request): Promise<Response> {
    const response = await this.app.fetch(request)
    if (new URL(request.url).pathname === '/api/v1/session' && response.ok) {
      const session = await response.json<Record<string, unknown>>()
      return Response.json({ ...session, draftScope: this.ctx.id.toString(), workspaceExpiresInDays: 7 }, { headers: response.headers })
    }
    return response
  }
  async alarm() { await this.ctx.storage.deleteAll() }
}
