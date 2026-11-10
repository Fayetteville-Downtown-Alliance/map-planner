import { issueSession, readCookie, sessionCookie, verifySession } from './session'
export { PreviewWorkspace } from './workspace'
const failure = (status: number, code: string, message: string) => Response.json({ error: { code, message } }, { status, headers: { 'Cache-Control': 'no-store' } })
function secure(response: Response): Response {
  const result = new Response(response.body, response)
  result.headers.set('X-Content-Type-Options', 'nosniff')
  result.headers.set('X-Frame-Options', 'DENY')
  result.headers.set('Referrer-Policy', 'same-origin')
  result.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' data: blob:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
  return result
}
export default {
  async fetch(request: Request, env: Cloudflare.Env): Promise<Response> {
    try {
      const url = new URL(request.url), isApi = url.pathname.startsWith('/api/')
      const origin = request.headers.get('Origin')
      if (isApi && (origin && origin !== url.origin || request.headers.get('Sec-Fetch-Site') === 'cross-site')) return secure(failure(403, 'preview_origin', 'Open this preview directly to use its workspace.'))
      if (url.pathname === '/api/health') return secure(Response.json({ status: 'ok', mode: 'isolated-synthetic-preview', version: '0.1.0-alpha.3', buildRevision: env.BUILD_REVISION, outboundDelivery: false }, { headers: { 'Cache-Control': 'no-store' } }))
      if (!['GET','HEAD','POST','PATCH'].includes(request.method)) return secure(failure(405, 'method', 'Method not supported.'))
      const ip = request.headers.get('CF-Connecting-IP') ?? 'local'
      if (isApi && !(await env.REQUEST_LIMITER.limit({ key: ip })).success) return secure(failure(429, 'preview_rate_limit', 'Preview request limit reached. Try again in a minute.'))
      let session = readCookie(request), id = await verifySession(session, env.PREVIEW_SESSION_KEY), issued = false
      if (!id) {
        const bootstrap = request.method === 'GET' && (url.pathname === '/' || url.pathname === '/api/v1/session')
        if (!bootstrap) {
          if (isApi) return secure(failure(401, 'preview_session', 'Your preview session is unavailable or expired. Keep your draft and reload the preview.'))
        } else {
          if (!(await env.SESSION_LIMITER.limit({ key: ip })).success) return secure(failure(429, 'preview_session_limit', 'Too many preview workspaces were opened. Try again in a minute.'))
          session = await issueSession(env.PREVIEW_SESSION_KEY); id = await verifySession(session, env.PREVIEW_SESSION_KEY); issued = true
        }
      }
      let response: Response
      if (isApi) {
        if (!id) return secure(failure(401, 'preview_session', 'Open the preview to start your synthetic workspace.'))
        response = await env.WORKSPACES.getByName(id).handle(request)
        response = new Response(response.body, response)
        response.headers.set('Cache-Control', 'private, no-store')
      } else {
        const assetUrl = new URL(request.url)
        if (url.pathname === '/') assetUrl.pathname = '/apps/web/index.html'
        response = await env.ASSETS.fetch(new Request(assetUrl, request))
        if (response.status === 404 && url.pathname.startsWith('/assets/')) response = new Response('Asset not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
        if (url.pathname === '/') { response = new Response(response.body, response); response.headers.set('Cache-Control','no-store') }
      }
      response = secure(response)
      if (issued && session) response.headers.append('Set-Cookie', sessionCookie(session))
      return response
    } catch (error) {
      console.error(JSON.stringify({ event: 'preview_request_failed', name: error instanceof Error ? error.name : 'Error' }))
      return secure(failure(500, 'preview_unavailable', 'The preview could not confirm this request. Keep your draft and check its operation receipt.'))
    }
  },
} satisfies ExportedHandler<Cloudflare.Env>
