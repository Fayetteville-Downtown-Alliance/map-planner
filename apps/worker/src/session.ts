export const cookieName = '__Host-mapplanner_preview'
export const lifetimeSeconds = 7 * 24 * 60 * 60
const encoder = new TextEncoder()
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
const keyFor = (secret: string) => {
  if (secret.length < 32) throw new Error('Preview session signing key is missing.')
  return crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}
export async function issueSession(secret: string, now = Date.now()) {
  const id = hex(crypto.getRandomValues(new Uint8Array(32)))
  const expires = Math.floor(now/1000) + lifetimeSeconds
  const payload = `v1.${id}.${expires}`
  const signature = hex(new Uint8Array(await crypto.subtle.sign('HMAC', await keyFor(secret), encoder.encode(payload))))
  return `${payload}.${signature}`
}
export async function verifySession(value: string | undefined, secret: string, now = Date.now()): Promise<string | null> {
  if (!value || !/^v1\.[a-f0-9]{64}\.[0-9]{10}\.[a-f0-9]{64}$/.test(value)) return null
  const [version,id,expires,signature] = value.split('.')
  if (Number(expires) <= now/1000 || Number(expires) > now/1000 + lifetimeSeconds + 60) return null
  const bytes = Uint8Array.from(signature.match(/../g)!, b => parseInt(b,16))
  const valid = await crypto.subtle.verify('HMAC', await keyFor(secret), bytes, encoder.encode(`${version}.${id}.${expires}`))
  return valid ? id : null
}
export function readCookie(request: Request): string | undefined {
  const matches = (request.headers.get('Cookie') ?? '').split(';').map(v => v.trim()).filter(v => v.startsWith(`${cookieName}=`))
  return matches.length === 1 ? matches[0].slice(cookieName.length+1) : undefined
}
export const sessionCookie = (value: string) => `${cookieName}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${lifetimeSeconds}`
