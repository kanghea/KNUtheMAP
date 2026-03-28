import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import {
  Room, OPTION_META, CHECKLIST_META, formatPrice, formatArea,
} from '@/lib/types/room'

// ── 섹션 제목 ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px' }}>
      {children}
    </h2>
  )
}

function Divider() {
  return <div style={{ height: 8, background: 'var(--bg-secondary)', margin: '0 -16px' }} />
}

// ── 메인 ─────────────────────────────────────────────────────────────

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let room: Room | null = null
  try {
    const supabase = await createSupabaseServer()
    const { data, error } = await supabase
      .from('rooms')
      .select('*, buildings(name, address, lat, lng, zone)')
      .eq('id', id)
      .eq('is_active', true)
      .single()
    if (!error && data) room = data as Room
  } catch {
    // rooms 테이블 미생성
  }

  if (!room) notFound()

  const building = room.buildings
  const options  = Object.entries(OPTION_META) as [keyof typeof OPTION_META, { label: string; icon: string }][]
  const checks   = Object.entries(CHECKLIST_META) as [string, string][]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-elevated)', paddingBottom: 100 }}>

      {/* ── 사진 갤러리 ──────────────────────────────────────────── */}
      <div style={{ position: 'relative' }}>
        {room.images.length > 0 ? (
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none', gap: 2 }}>
            {room.images.map((src, i) => (
              <img key={i} src={src} alt=""
                style={{ width: '100vw', height: 280, objectFit: 'cover', flexShrink: 0 }} />
            ))}
          </div>
        ) : (
          <div style={{
            height: 280, background: 'linear-gradient(135deg, var(--border-secondary), var(--bg-secondary))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56,
          }}>🏠</div>
        )}

        {/* 뒤로가기 */}
        <Link href="/rooms" style={{
          position: 'absolute', top: 16, left: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textDecoration: 'none',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </Link>

        {/* 찜 버튼 */}
        <button style={{
          position: 'absolute', top: 16, right: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          🤍
        </button>
      </div>

      <div style={{ padding: '20px 16px 0' }}>

        {/* ── 가격 & 기본 정보 ──────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text-primary)', marginBottom: 6 }}>
            {formatPrice(room)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>
            {[room.room_type, room.floor ? `${room.floor}층` : null, room.area_m2 ? formatArea(room.area_m2) : null]
              .filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {building?.address ?? '주소 정보 없음'}
          </div>
        </div>

        <Divider />

        {/* ── 특성 태그 ────────────────────────────────────────── */}
        {room.characteristics.length > 0 && (
          <div style={{ padding: '16px 0' }}>
            <SectionTitle>특성</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {room.characteristics.map((c) => (
                <span key={c} style={{
                  background: 'var(--color-primary-bg)', color: 'var(--color-primary)',
                  borderRadius: 999, padding: '6px 12px',
                  fontSize: 12, fontWeight: 600,
                }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        {room.characteristics.length > 0 && <Divider />}

        {/* ── 상세 설명 ─────────────────────────────────────────── */}
        {room.description && (
          <>
            <div style={{ padding: '16px 0' }}>
              <SectionTitle>상세 설명</SectionTitle>
              <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75, margin: 0 }}>
                {room.description}
              </p>
            </div>
            <Divider />
          </>
        )}

        {/* ── 옵션 ─────────────────────────────────────────────── */}
        <div style={{ padding: '16px 0' }}>
          <SectionTitle>옵션</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {options.map(([key, meta]) => {
              const on = room.options[key] === true
              return (
                <div key={key} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  opacity: on ? 1 : 0.3,
                }}>
                  <span style={{ fontSize: 22 }}>{meta.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: on ? 'var(--text-primary)' : 'var(--text-tertiary)', textAlign: 'center' }}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <Divider />

        {/* ── 입주자 체크리스트 ─────────────────────────────────── */}
        <div style={{ padding: '16px 0' }}>
          <SectionTitle>입주자 체크리스트</SectionTitle>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', margin: '0 0 12px' }}>
            관리자가 매물 등록 시 직접 확인한 항목입니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {checks.map(([key, label]) => {
              const val = room.checklist[key as keyof typeof room.checklist]
              const checked = val === true
              const failed  = val === false
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: checked ? 'var(--color-green-bg)' : failed ? 'var(--color-red-bg)' : 'var(--bg-secondary)',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {checked ? '✅' : failed ? '❌' : '➖'}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: checked ? 'var(--color-green)' : failed ? '#dc2626' : 'var(--text-secondary)',
                  }}>
                    {label}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {checked ? '확인' : failed ? '미확인' : '정보 없음'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <Divider />

        {/* ── 위치 ─────────────────────────────────────────────── */}
        {building && (
          <>
            <div style={{ padding: '16px 0' }}>
              <SectionTitle>위치</SectionTitle>
              <div style={{
                height: 160, background: 'var(--bg-tertiary)', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8,
              }}>
                <span style={{ fontSize: 28 }}>📍</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', padding: '0 16px' }}>
                  {building.address}
                </span>
              </div>
              <Link href={`/buildings/${room.building_id}`} style={{
                display: 'block', marginTop: 10, padding: '10px 14px',
                background: 'var(--bg-secondary)', borderRadius: 10,
                fontSize: 13, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none',
                textAlign: 'center',
              }}>
                건물 상세 보기 →
              </Link>
            </div>
            <Divider />
          </>
        )}

        {/* ── 연락처 ───────────────────────────────────────────── */}
        <div style={{ padding: '16px 0' }}>
          <SectionTitle>연락처</SectionTitle>
          {room.contact_phone ? (
            <a href={`tel:${room.contact_phone}`} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px', background: 'var(--bg-secondary)', borderRadius: 14,
              textDecoration: 'none',
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>📞</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {room.contact_name ?? '건물주'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 2 }}>
                  {room.contact_phone}
                </div>
              </div>
            </a>
          ) : (
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>연락처 정보 없음</p>
          )}
        </div>

        <Divider />

        {/* ── 집 리뷰 ──────────────────────────────────────────── */}
        <div style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SectionTitle>집 리뷰</SectionTitle>
            <Link href={`/buildings/${room.building_id}#reviews`}
              style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'none', fontWeight: 500 }}>
              전체 보기
            </Link>
          </div>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 14, padding: '20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>💬</span>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0, textAlign: 'center' }}>
              아직 리뷰가 없어요.<br/>첫 번째 리뷰를 남겨보세요.
            </p>
            <Link href={`/buildings/${room.building_id}#write-review`} style={{
              marginTop: 4, padding: '8px 18px',
              background: 'var(--color-primary)', color: 'var(--text-inverse)', borderRadius: 999,
              fontSize: 12, fontWeight: 700, textDecoration: 'none',
            }}>
              리뷰 작성
            </Link>
          </div>
        </div>

        <Divider />

        {/* ── 이 지역 비슷한 매물 ───────────────────────────────── */}
        <div style={{ padding: '16px 0' }}>
          <SectionTitle>이 지역 비슷한 매물</SectionTitle>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 14, padding: '20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0 }}>
              같은 구역의 비슷한 매물을 불러옵니다.
            </p>
            <Link href="/rooms" style={{
              padding: '8px 18px',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: 999,
              fontSize: 12, fontWeight: 600, textDecoration: 'none',
            }}>
              매물 목록으로
            </Link>
          </div>
        </div>

      </div>

      {/* ── 하단 고정 CTA ─────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 80, left: 0, right: 0,
        padding: '12px 16px',
        background: 'var(--bg-overlay)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-primary)',
      }}>
        {room.contact_phone && (
          <a href={`tel:${room.contact_phone}`} style={{
            display: 'block', textAlign: 'center',
            background: 'var(--color-primary)', color: 'var(--text-inverse)',
            borderRadius: 14, padding: '14px',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
          }}>
            📞 연락하기
          </a>
        )}
      </div>
    </div>
  )
}
