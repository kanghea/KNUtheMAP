/**
 * lib/role-cookie.ts
 *
 * AES-256-GCM 암호화 + AEAD 인증 태그 검증으로 role 쿠키를 보호합니다.
 *
 * 보안 설계:
 *  - NEXTAUTH_SECRET → scrypt(N=16384) → 256-bit 파생 키
 *  - 매 암호화마다 고유 IV(96-bit) 생성 → 동일 role도 결과값이 달라짐 (nonce 재사용 없음)
 *  - GCM 인증 태그(128-bit)로 변조 즉시 감지 (decryptFinal 예외 발생)
 *  - 복호화 실패(변조·만료·잘못된 포맷) 시 항상 null 반환
 *  - 서버 전용 모듈 (Node.js crypto) — Edge Runtime에서 호출 금지
 *
 * 쿠키 속성 권장:
 *  HttpOnly=true, Secure=true(production), SameSite=Lax, Path=/
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import type { Role } from './useRole'

const ALGORITHM = 'aes-256-gcm'
const KEY_LEN   = 32   // 256-bit AES 키
const IV_LEN    = 12   // 96-bit GCM nonce (NIST 권장)
const TAG_LEN   = 16   // 128-bit GCM 인증 태그

const VALID_ROLES: readonly string[] = ['tenant', 'owner', 'agent', 'admin', 'roommate', 'bangbwayo']

// 파생 키: 서버 프로세스 기동 후 최초 호출 시 1회만 계산, 이후 캐시
let _derivedKey: Buffer | null = null

function getDerivedKey(): Buffer {
  if (_derivedKey) return _derivedKey
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('NEXTAUTH_SECRET 환경변수가 설정되지 않았습니다')
  // scrypt: N=16384, r=8, p=1 — 최초 1회 ~30ms
  _derivedKey = scryptSync(secret, 'knuthe-map:role-cookie:v1', KEY_LEN, { N: 16384, r: 8, p: 1 })
  return _derivedKey
}

/**
 * role 값을 AES-256-GCM으로 암호화해 base64url 문자열로 반환합니다.
 * 쿠키에 직접 저장할 수 있는 형태입니다.
 */
export function sealRole(role: Role): string {
  const key       = getDerivedKey()
  const iv        = randomBytes(IV_LEN)
  const cipher    = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(role, 'utf8'), cipher.final()])
  const tag       = cipher.getAuthTag()
  // 레이아웃: [IV 12B] [TAG 16B] [CIPHERTEXT] → base64url
  return Buffer.concat([iv, tag, encrypted]).toString('base64url')
}

/**
 * sealRole()로 생성된 토큰을 복호화합니다.
 * 변조·포맷 오류·알 수 없는 role 값이면 null을 반환합니다.
 */
export function unsealRole(token: string): Role | null {
  try {
    const key        = getDerivedKey()
    const buf        = Buffer.from(token, 'base64url')
    if (buf.length < IV_LEN + TAG_LEN + 1) return null

    const iv         = buf.subarray(0, IV_LEN)
    const tag        = buf.subarray(IV_LEN, IV_LEN + TAG_LEN)
    const ciphertext = buf.subarray(IV_LEN + TAG_LEN)

    const decipher = createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    // GCM final() 시 인증 태그 불일치 → 예외 발생 (변조 감지)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    const role      = decrypted.toString('utf8')

    if (!VALID_ROLES.includes(role)) return null
    return role as Role
  } catch {
    // 복호화 실패: 변조, 잘못된 키, 잘못된 포맷 등
    return null
  }
}

/** knu_role 쿠키 이름 */
export const ROLE_COOKIE_NAME = 'knu_role'

/** 공통 쿠키 옵션 */
export const ROLE_COOKIE_OPTIONS = {
  path:     '/',
  maxAge:   60 * 60 * 24,                              // 24시간 TTL (role 변경 최대 지연 bound)
  httpOnly: true,                                       // JS document.cookie 접근 불가
  sameSite: 'lax'  as const,
  secure:   process.env.NODE_ENV === 'production',     // HTTPS 전용 (production)
}
