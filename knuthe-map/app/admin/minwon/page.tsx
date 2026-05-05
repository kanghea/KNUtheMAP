import { redirect } from 'next/navigation'
import { getServerUser, getServerRole } from '@/lib/auth-server'
import { createServiceClient } from '@/lib/supabase'
import { getServerThemeTokens } from '@/lib/theme-server'
import { PageWrapper } from '@/components/shared/PageWrapper'
import { DashboardHeader } from '@/components/shared/DashboardHeader'
import { Card } from '@/components/shared/Card'
import { EmptyState } from '@/components/shared/EmptyState'
import { IconInbox } from '@/components/shared/icons'
import MinwonStatusSelect from './_components/MinwonStatusSelect'

interface MinwonRow {
  id:                string
  complaint_text:    string
  image_url:         string | null
  building_address:  string
  building_phone:    string
  user_school:       string
  user_dept:         string
  user_grade:        string
  user_age:          number
  user_phone:        string
  status:            'pending' | 'in_progress' | 'resolved' | 'rejected'
  admin_note:        string | null
  created_at:        string
}

const STATUS_LABEL: Record<MinwonRow['status'], string> = {
  pending:     '대기',
  in_progress: '처리 중',
  resolved:    '완료',
  rejected:    '반려',
}

export default async function AdminMinwonPage() {
  const [user, role, themed] = await Promise.all([
    getServerUser(),
    getServerRole(),
    getServerThemeTokens(),
  ])
  if (!user) redirect('/login')
  if (role !== 'admin') redirect('/')

  const { tok } = themed
  const service = createServiceClient()

  const { data: rows } = await service
    .from('minwons')
    .select('id, complaint_text, image_url, building_address, building_phone, user_school, user_dept, user_grade, user_age, user_phone, status, admin_note, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  const list = (rows ?? []) as MinwonRow[]
  const pendingCount = list.filter(r => r.status === 'pending').length

  return (
    <PageWrapper tok={tok}>
      <DashboardHeader
        tok={tok}
        title="민원 관리"
        subtitle={`대기 중 ${pendingCount}건 / 전체 ${list.length}건`}
        backHref="/admin"
      />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '20px 16px',
                    display: 'flex', flexDirection: 'column', gap: 12 }}>
        {list.length === 0 && (
          <EmptyState
            tok={tok}
            icon={<IconInbox size={36} color={tok.textTertiary} />}
            title="접수된 민원이 없습니다"
          />
        )}

        {list.map(row => (
          <Card key={row.id} tok={tok} padding={16} radius={14}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                fontSize: 11, fontWeight: 700,
                padding: '4px 10px', borderRadius: 999,
                background: statusBg(row.status, tok),
                color:      statusColor(row.status, tok),
              }}>{STATUS_LABEL[row.status]}</span>
              <span style={{ fontSize: 11, color: tok.textTertiary }}>
                {new Date(row.created_at).toLocaleString('ko-KR')}
              </span>
            </div>

            <p style={{
              fontSize: 14, color: tok.textPrimary, margin: 0,
              lineHeight: 1.6, whiteSpace: 'pre-wrap',
            }}>{row.complaint_text}</p>

            {row.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.image_url} alt="민원 사진"
                   style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 10 }} />
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <InfoCell tok={tok} label="건물 주소"     value={row.building_address} />
              <InfoCell tok={tok} label="건물주 연락처" value={row.building_phone} />
              <InfoCell tok={tok} label="접수자 학교"   value={row.user_school} />
              <InfoCell tok={tok} label="접수자 학과"   value={row.user_dept} />
              <InfoCell tok={tok} label="접수자 학번"   value={row.user_grade} />
              <InfoCell tok={tok} label="접수자 나이"   value={`${row.user_age}세`} />
              <InfoCell tok={tok} label="접수자 연락처" value={row.user_phone}
                        full />
            </div>

            <MinwonStatusSelect id={row.id} status={row.status} adminNote={row.admin_note ?? ''} />
          </Card>
        ))}
      </div>
    </PageWrapper>
  )
}

function InfoCell({
  tok, label, value, full,
}: { tok: import('@/lib/theme-tokens').ThemeTokens; label: string; value: string; full?: boolean }) {
  return (
    <div style={{
      gridColumn: full ? '1 / -1' : undefined,
      padding: '8px 10px',
      background: tok.inputBg,
      border: `1px solid ${tok.cardBorder}`,
      borderRadius: 8,
      display: 'flex', flexDirection: 'column', gap: 2,
      minWidth: 0,
    }}>
      <span style={{ fontSize: 10, color: tok.textTertiary, fontWeight: 700 }}>{label}</span>
      <span style={{
        fontSize: 13, color: tok.textPrimary,
        // 한글 단어 단위 줄바꿈 + 긴 영문/숫자도 강제 wrap
        wordBreak: 'keep-all', overflowWrap: 'anywhere',
      }}>{value}</span>
    </div>
  )
}

function statusBg(s: MinwonRow['status'], tok: import('@/lib/theme-tokens').ThemeTokens): string {
  if (s === 'pending')     return tok.dangerBg
  if (s === 'in_progress') return tok.accentBg
  if (s === 'resolved')    return tok.successBg
  return tok.inputBg
}
function statusColor(s: MinwonRow['status'], tok: import('@/lib/theme-tokens').ThemeTokens): string {
  if (s === 'pending')     return tok.dangerColor
  if (s === 'in_progress') return tok.accentColor
  if (s === 'resolved')    return tok.successColor
  return tok.textSecondary
}
