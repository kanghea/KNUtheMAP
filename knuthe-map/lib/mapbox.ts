export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export const MAPBOX_STYLE = 'mapbox://styles/kanghae/cmn4en33v00nc01skhcdsahel'

// 경북대학교 북문 기준 초기 좌표
export const KNU_CENTER: [number, number] = [128.6076, 35.8892]

export const MAP_DEFAULTS = {
  center: KNU_CENTER,
  zoom: 15,
  pitch: 45,
  bearing: 0,
} as const
