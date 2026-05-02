/**
 * 트랙 카드 흐름의 단계 컴포넌트들 사이에서 공유되는 타입.
 *
 * `next/dynamic` 으로 lazy-load 되는 자식 컴포넌트(AddressStep 등) 와
 * 부모 TrackCardFlow 가 동일한 형태를 사용하면서도 코드 분할에 영향
 * 주지 않도록 별도 파일로 분리.
 */

export interface BuildingRow {
  id:      string
  name:    string | null
  address: string | null
  lat:     number | null
  lng:     number | null
}

export interface Coord {
  lat: number
  lng: number
}
