import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import {
  Room, OPTION_META, CHECKLIST_META, formatPrice, formatArea,
} from '@/lib/types/room'

// ── 섹션 제목 ────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>
      {children}
    </h2>
  )
}

function Divider() {
  return <div style={{ height: 8, background: '#f8fafc', margin: '0 -16px' }} />
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
    <div style={{ minHeight: '100vh', background: '#fff', paddingBottom: 100 }}>

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
            height: 280, background: 'linear-gradient(135deg,#e2e8f0,#f8fafc)',
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
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 6 }}>
            {formatPrice(room)}
          </div>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>
            {[room.room_type, room.floor ? `${room.floor}층` : null, room.area_m2 ? formatArea(room.area_m2) : null]
              .filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>
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
                  background: '#eff6ff', color: '#2563eb',
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
              <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.75, margin: 0 }}>
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
                  <span style={{ fontSize: 10, fontWeight: 600, color: on ? '#0f172a' : '#94a3b8', textAlign: 'center' }}>
                    {meta.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <Divider />

        {/* ── 세입자 체크리스트 ─────────────────────────────────── */}
        <div style={{ padding: '16px 0' }}>
          <SectionTitle>세입자 체크리스트</SectionTitle>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 12px' }}>
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
                  background: checked ? '#f0fdf4' : failed ? '#fef2f2' : '#f8fafc',
                }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>
                    {checked ? '✅' : failed ? '❌' : '➖'}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: checked ? '#16a34a' : failed ? '#dc2626' : '#64748b',
                  }}>
                    {label}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
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
                height: 160, background: '#f1f5f9', borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: 8,
              }}>
                <span style={{ fontSize: 28 }}>📍</span>
                <span style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '0 16px' }}>
                  {building.address}
                </span>
              </div>
              <Link href={`/buildings/${room.building_id}`} style={{
                display: 'block', marginTop: 10, padding: '10px 14px',
                background: '#f8fafc', borderRadius: 10,
                fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none',
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
              padding: '14px 16px', background: '#f8fafc', borderRadius: 14,
              textDecoration: 'none',
            }}>
              <span style={{
                width: 40, height: 40, borderRadius: '50%', background: '#eff6ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>📞</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                  {room.contact_name ?? '건물주'}
                </div>
                <div style={{ fontSize: 12, color: '#2563eb', marginTop: 2 }}>
                  {room.contact_phone}
                </div>
              </div>
            </a>
          ) : (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>연락처 정보 없음</p>
          )}
        </div>

        <Divider />

        {/* ── 집 리뷰 ──────────────────────────────────────────── */}
        <div style={{ padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <SectionTitle>집 리뷰</SectionTitle>
            <Link href={`/buildings/${room.building_id}#reviews`}
              style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'none', fontWeight: 500 }}>
              전체 보기
            </Link>
          </div>
          <div style={{
            background: '#f8fafc', borderRadius: 14, padding: '20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 28 }}>💬</span>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, textAlign: 'center' }}>
              아직 리뷰가 없어요.<br/>첫 번째 리뷰를 남겨보세요.
            </p>
            <Link href={`/buildings/${room.building_id}#write-review`} style={{
              marginTop: 4, padding: '8px 18px',
              background: '#2563eb', color: '#fff', borderRadius: 999,
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
            background: '#f8fafc', borderRadius: 14, padding: '20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
              같은 구역의 비슷한 매물을 불러옵니다.
            </p>
            <Link href="/rooms" style={{
              padding: '8px 18px',
              background: '#f1f5f9', color: '#475569', borderRadius: 999,
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
        background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid #f1f5f9',
      }}>
        {room.contact_phone && (
          <a href={`tel:${room.contact_phone}`} style={{
            display: 'block', textAlign: 'center',
            background: '#2563eb', color: '#fff',
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
