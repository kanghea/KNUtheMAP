import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const service = createServiceClient()

  const { data, error } = await service
    .from('transactions')
    .select('contract_type, rent, deposit, maintenance, area_m2, floor, room_type, unit_number, contract_date, contract_start, contract_end, source')
    .eq('building_id', id)
    .eq('is_active', true)
    .order('contract_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const txs = data ?? []
  const monthly = txs.filter((t) => t.contract_type === '월세' && t.rent)
  const summary = monthly.length
    ? {
        avg_rent: Math.round(monthly.reduce((s, t) => s + (t.rent ?? 0), 0) / monthly.length),
        min_rent: Math.min(...monthly.map((t) => t.rent ?? 0)),
        max_rent: Math.max(...monthly.map((t) => t.rent ?? 0)),
        count: monthly.length,
      }
    : null

  return NextResponse.json({ transactions: txs, summary })
}
