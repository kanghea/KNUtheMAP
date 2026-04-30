/**
 * lib/view-mode-cookie.ts
 *
 * 사용자가 hot-swap 가능한 "보기 모드"(방보기 ↔ 룸메이트)를 저장하는
 * AES-256-GCM 암호화 HttpOnly 쿠키.
 *
 * 설계 메모:
 *  - DB의 `users.role`은 권한(authorization)을 나타내고, 이 쿠키는 표시(view)를
 *    나타낸다. 둘은 보통 일치하지만 사용자가 토글 직후 일시 불일치할 수 있다.
 *  - 보안 모델은 `lib/role-cookie.ts`와 동일: scrypt(N=16384) 키 유도,
 *    96-bit IV, 128-bit GCM 인증 태그. NEXTAUTH_SECRET 사용.
 *  - "knuthe-map:view-mode-cookie:v1" salt로 role 키와 분리(키 재사용 방지).
 *  - 변조·잘못된 포맷·알 수 없는 값은 모두 null 반환 → 호출부는 기본값 폴백.
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

export type ViewMode = 'rooms' | 'roommate'

const ALGORITHM = 'aes-256-gcm'
const KEY_LEN   = 32
const IV_LEN    = 12
const TAG_LEN   = 16

const VALID_VIEW_MODES: readonly string[] = ['rooms', 'roommate']

let _derivedKey: Buffer | null = null

function getDerivedKey(): Buffer {
  if (_derivedKey) return _derivedKey
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET 환경변수가 설정되지 않았습니다')
  _derivedKey = scryptSync(secret, 'knuthe-map:view-mode-cookie:v1', KEY_LEN, { N: 16384, r: 8, p: 1 })
  return _derivedKey
}

export function sealViewMode(mode: ViewMode): string {
  const key       = getDerivedKey()
  const iv        = randomBytes(IV_LEN)
  const cipher    = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(mode, 'utf8'), cipher.final()])
  const tag       = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64url')
}

export function unsealViewMode(token: string): ViewMode | null {
  try {
    const key = getDerivedKey()
    const buf = Buffer.from(token, 'base64url')
    if (buf.length < IV_LEN + TAG_LEN + 1) return null

    const iv         = buf.subarray(0, IV_LEN)
    const tag        = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
    const ciphertext = buf.subarray(IV_LEN + TAG_LEN)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    const mode      = decrypted.toString('utf8')

    if (!VALID_VIEW_MODES.includes(mode)) return null
    return mode as ViewMode
  } catch {
    return null
  }
}

export const VIEW_MODE_COOKIE_NAME = 'knu_view_mode'

export const VIEW_MODE_COOKIE_OPTIONS = {
  path:     '/',
  maxAge:   60 * 60 * 24 * 30,                       // 30일 — 사용자 선호 기억
  httpOnly: true,
  sameSite: 'lax' as const,
  secure:   process.env.NODE_ENV === 'production',
}
