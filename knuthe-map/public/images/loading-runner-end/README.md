# Loading Runner — End Motion (4프레임 종료 모션)

`<LoadingRunner>` (components/shared/LoadingRunner.tsx) 의 **종료 모드** 자산.
`<LoadingRunnerOverlay show={...}>` 가 `show: true → false` 전환을 감지하면
1회 재생된 뒤 unmount. 캐릭터가 맨홀로 사라지는 컷.

## 자산 (256×256, RGBA)

이 폴더에 다음 4장을 두면 자동으로 적용됩니다. (자산이 없으면 첫 프레임의
`onError` 가 발화되어 즉시 unmount → 깨진 이미지가 보이지 않음)

| 번호 | 파일 | 의미 |
|---|---|---|
| 1 | `frame-01.png` | 맨홀 위 정지 자세 (놀람) |
| 2 | `frame-02.png` | 손 들고 빠지기 시작 |
| 3 | `frame-03.png` | 상체까지 들어감 |
| 4 | `frame-04.png` | 손과 머리 일부만 보임 (거의 사라짐) |

## 타이밍

총 600ms (한 프레임 150ms × 4). `LoadingRunner.tsx` 의 `END_DURATION_MS` 와 동기화.

| idx | 시작(ms) | 끝(ms) |
|----|--------:|------:|
| 1  |   0   | 150 |
| 2  | 150   | 300 |
| 3  | 300   | 450 |
| 4  | 450   | 600 |

600ms 후 `onEndComplete` 콜백 → overlay unmount.

## 정렬 사양

러닝/탭 프레임과 동일:
- 발바닥 또는 맨홀 기준선 y=234 (캔버스 하단에서 22px 위)
- 무게중심 X 가 캔버스 중앙
- 외곽 흰색만 4-connectivity flood-fill 로 투명, 내부 흰 소매·운동화 보존

## 재생성 방법

원본 4컷 횡렬 이미지가 있다면 `scripts/slice_tap_frames.py` 를 참조해
유사 스크립트로 슬라이스. (러닝과 달리 12장이 아닌 4장이라 탭 슬라이스
스크립트가 그대로 가까움.)
