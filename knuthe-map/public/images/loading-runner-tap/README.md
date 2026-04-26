# Loading Runner — Tap Reaction (4프레임 거부 제스처)

`<LoadingRunner>` (components/shared/LoadingRunner.tsx) 의 **탭 모드** 자산.
사용자가 러너 캐릭터를 터치/클릭하면 1회 재생되는 4프레임 애니메이션.

## 자산 (256×256, RGBA)

| 번호 | 파일 | 의미 |
|---|---|---|
| 1 | `frame-01.png` | 정지 자세 (살짝 짜증) |
| 2 | `frame-02.png` | 한 손 들기 (motion line) |
| 3 | `frame-03.png` | 손바닥 펴서 정면 (강한 거부) |
| 4 | `frame-04.png` | 두 손 앞으로, 눈 감은 채 최대 거부 |

## 타이밍

총 600ms (한 프레임 150ms × 4). `LoadingRunner.tsx` 의 `TAP_DURATION_MS` 와 동기화.

| idx | 시작(ms) | 끝(ms) |
|----|--------:|------:|
| 1  |   0   | 150 |
| 2  | 150   | 300 |
| 3  | 300   | 450 |
| 4  | 450   | 600 |

600ms 후 `mode='run'` 으로 자동 복귀 → 러닝 사이클 재개.

## 정렬 사양

러닝 프레임과 동일:
- 발바닥 기준선 y=234 (캔버스 하단에서 22px 위)
- 무게중심 X 가 캔버스 중앙
- 외곽 흰색만 4-connectivity flood-fill 로 투명, 내부 흰 소매·운동화 보존

## 재생성 방법

```bash
# 원본 1536×1024 또는 612×408 JPEG 모두 지원
python3 scripts/slice_tap_frames.py path/to/source.jpg
```
