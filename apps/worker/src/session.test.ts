import { expect, it } from 'vitest'
import { issueSession, verifySession, lifetimeSeconds, sessionCookie, readCookie } from './session'
const secret = 'test-only-signing-key-with-at-least-32-characters'
it('verifies issued sessions, isolates random identities and rejects expiry/forgery/key rotation', async () => {
  const now = 1_800_000_000_000
  const first = await issueSession(secret, now), second = await issueSession(secret, now)
  expect(await verifySession(first, secret, now)).toBeTruthy()
  expect(await verifySession(first, secret, now)).not.toBe(await verifySession(second, secret, now))
  expect(await verifySession(first, secret, now+lifetimeSeconds*1000)).toBeNull()
  expect(await verifySession(first, secret+'rotated', now)).toBeNull()
  expect(await verifySession(first.replace('v1.', 'v2.'), secret, now)).toBeNull()
  expect(await verifySession(first.slice(0,-1)+(first.endsWith('0')?'1':'0'),secret,now)).toBeNull()
  expect(await verifySession('invalid',secret,now)).toBeNull()
})
it('uses a host-only secure cookie and rejects duplicate cookie ambiguity', () => {
  const cookie = sessionCookie('test-only-value')
  expect(cookie).toMatch(/__Host-mapplanner_preview=test-only-value; Path=\/; Secure; HttpOnly; SameSite=Lax/)
  expect(cookie).not.toContain('Domain=')
  expect(readCookie(new Request('https://preview.example', { headers: { Cookie: '__Host-mapplanner_preview=one; __Host-mapplanner_preview=two' } }))).toBeUndefined()
})
