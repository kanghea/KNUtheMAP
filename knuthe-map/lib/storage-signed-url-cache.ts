/**
 * Supabase Storage signed URL — Lambda 인스턴스 메모리 LRU 캐시.
 *
 * 같은 storage_path 에 대해 signedUrl 이 만료 전까지 같은 값이라는 점을
 * 활용. 매 페이지 렌더마다 storage 에 새로 서명 요청 보내던 100~300ms
 * 왕복이 캐시 적중 시 사실상 0 으로 줄어듦.
 *
 * 메모리는 Vercel/Next.js Lambda 인스턴스 단위 — cold start 마다 비워진다.
 * 그래도 warm 상태에선 같은 사용자가 여러 페이지 사이를 오갈 때 거의
 * 모두 적중.
 *
 * 안전 마진: 만료 시각 1시간 전부터는 캐시 미스 처리 → 응답 사용 중
 * 만료되는 사고 차단.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

interface CacheEntry {
  url:       string
  expiresAt: number  // epoch ms
}

const SAFETY_MARGIN_MS = 60 * 60 * 1000   // 1시간
const MAX_ENTRIES      = 5_000             // 단순 LRU 상한

const cache = new Map<string, CacheEntry>()  // bucket:path → entry

function key(bucket: string, path: string): string {
  return `${bucket}:${path}`
}

function getCached(bucket: string, path: string): string | null {
  const k = key(bucket, path)
  const entry = cache.get(k)
  if (!entry) return null
  if (entry.expiresAt - SAFETY_MARGIN_MS < Date.now()) {
    cache.delete(k)
    return null
  }
  // LRU bump — 다시 끼워 넣어 가장 최근 위치로
  cache.delete(k)
  cache.set(k, entry)
  return entry.url
}

function setCached(bucket: string, path: string, url: string, ttlSeconds: number): void {
  if (cache.size >= MAX_ENTRIES) {
    // Map 의 iteration 순서가 insertion 순 — 가장 오래된 키 한 개 제거.
    const firstKey = cache.keys().next().value
    if (firstKey !== undefined) cache.delete(firstKey)
  }
  cache.set(key(bucket, path), { url, expiresAt: Date.now() + ttlSeconds * 1000 })
}

/**
 * paths 에 해당하는 signed URL 을 반환. 캐시에 있으면 그대로, 없으면
 * Storage 에 한 번 호출해 누락분만 발급 후 결과 합쳐서 반환.
 *
 * @param service     service role Supabase client
 * @param bucket      Storage 버킷명
 * @param paths       storage_path 배열
 * @param ttlSeconds  새로 발급할 때의 TTL (default 24h)
 */
export async function signPathsCached(
  service:    SupabaseClient,
  bucket:     string,
  paths:      string[],
  ttlSeconds: number = 60 * 60 * 24,
): Promise<Record<string, string>> {
  if (paths.length === 0) return {}

  const result:  Record<string, string> = {}
  const toFetch: string[] = []

  // 중복 path 가 있을 수 있으므로 한 번만 발급
  const uniqPaths = Array.from(new Set(paths))
  for (const p of uniqPaths) {
    const cached = getCached(bucket, p)
    if (cached) result[p] = cached
    else        toFetch.push(p)
  }

  if (toFetch.length === 0) return result

  const { data } = await service.storage
    .from(bucket)
    .createSignedUrls(toFetch, ttlSeconds)

  toFetch.forEach((p, i) => {
    const url = data?.[i]?.signedUrl
    if (url) {
      result[p] = url
      setCached(bucket, p, url, ttlSeconds)
    }
  })
  return result
}
