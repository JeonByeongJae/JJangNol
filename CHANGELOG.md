# CHANGELOG — FUGITIVE (도망자)

## [알려진 이슈 / 다음 할 것]

### 버그
- Firebase Rules 미적용 — `runnerHand` 값이 추격자 클라이언트에 노출됨 (프로덕션 배포 전 필수)

### 개선 검토
- 실제 2인 플레이 검증 필요
  - 도망자 첫 턴: 2장 배치 후 자동 턴 종료 → 추격자로 넘어가는지
  - 추격자 첫 턴: 2장 드로우 정상 동작
  - 추리 성공: 카드 공개 + 부스터 eliminated + 피드백 플래시
  - 추리 실패: 피드백 플래시 + 도망자 턴 복귀

---

## [2026-04-19]

### Fixed
- 부스터 뒷면 표시 버그: 발자국 수(칸) 계산값 → `+N장` (장수만 표시)
- 영문 타이틀 RUNNER → FUGITIVE

### Changed
- 폰트: Georgia → Noto Serif KR (0/O 구분, 한국어 가독성 향상)
- 전체 폰트 크기 2~3px 증가 (모바일 가독성)
- 결과 화면: 게임 종료 시 도망자 카드 배열 정답 전체 공개 (부스터 장수 포함)

---

## [2026-04-17]

### Fixed
- 추격자 첫 턴 드로우 크래시 (`chaserHand` null 처리)
- Firebase 빈 배열 null/undefined 반환 문제 — `toArray<T>()` 헬퍼 전면 적용
- `piles` undefined 크래시 (도망자 패스 후 추격자 드로우 시)
- 도망자 최대 배치 수 하이라이트: `canPlaceMore` false 시 빈 배열 반환

### Added
- 추격자 추리 UI: trail 카드 탭 → ChaserBoard 번호 선택 → guessBadge 표시
- 추리 결과 피드백 플래시 (2초, 정답/오답)
- 추리 성공 시 해당 부스터 자동 `eliminated` 처리
- 추격자 추리 제출 후 자동 턴 종료
- 도망자 최대 배치 수 도달 시 자동 턴 종료
- `cardsPlacedThisTurn` Firebase 저장 (새로고침/재접속 후 복원)

### Changed
- 42번 카드 특례 제거 → 일반 간격 규칙 적용
- 손패 카드 숫자 14px → 18px

---

## [2026-04-16]

### Added
- GitHub Actions — main push 시 GitHub Pages 자동 배포
- 화면 라우터 (HomeScreen → LobbyScreen → GameScreen → ResultScreen)
- ResultScreen — 승패 결과 표시
- GameScreen — TurnBanner, CardTrail, CardPiles, HandCards, ChaserBoard, ActionPanel
- Firebase Realtime Database 연동 (방 생성/참가/실시간 동기화)
- 게임 핵심 로직: 카드 배치, 드로우, 부스터, 추리, 승리 조건
