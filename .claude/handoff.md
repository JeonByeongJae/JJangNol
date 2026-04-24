# Handoff — 2026-04-24

## 브랜치 / 커밋
- 브랜치: `feat/m/cant-stop`
- 최근 커밋:
  ca818fa fix(cant-stop): 첫 굴리기 후 콤보 선택 시 캠프 확정 버튼 활성화
  2ba73bb fix(cant-stop): URL 기반 라우팅으로 뒤로가기 후 재진입 버그 수정
  6108c9b fix(cant-stop): 캠프 확정 시 차례 안 넘어가는 버그 수정, 텍스트 변경
  c3fdc63 fix(cant-stop): 미리보기 셀 색상 더 뚜렷하게 개선
  2655c75 feat(cant-stop): 조합 선택 미리보기, 상대방 주사위 표시, bust 메시지 버튼

## 미커밋 변경사항
없음 (.claude/handoff.md 제외)

## 진행 중인 작업
없음 — 이번 세션 버그 수정 완료 후 배포됨.

## 완료된 것
- "캠프 확정" 버튼 비활성화 버그 수정
  - 원인: `disabled={climberCount === 0 || mustSelectCombo}` 조건이 잘못됨
  - 첫 굴리기 후 Firebase에 climbers가 없어 (`climberCount === 0`) 콤보 선택해도 버튼이 항상 비활성화
  - 수정: `disabled={mustSelectCombo || (climberCount === 0 && selectedCombo === null)}`
  - 콤보 선택 시 climberCount 무관하게 활성화되도록 변경
  - `stopClimbing`은 이미 combo 직접 처리 가능한 구조였으므로 버튼 조건만 수정으로 완료

## 다음에 할 것
1. **실제 게임 전체 플레이 검증** — 배포 사이트 https://jeonbyeongjae.github.io/JJangNol/ 에서 Cmd+Shift+R 후:
   - 굴리기 → 콤보 선택 → "캠프 확정" (첫 굴리기 후 바로 캠프) → 차례 전환 확인
   - 굴리기 → 콤보 선택 → "계속 굴리기" → 콤보 선택 → "캠프 확정" → 차례 전환 확인
   - 피켈 3개 꽉 찬 상태 bust 메시지 확인
   - bust → 차례 넘기기 확인
   - 컬럼 3개 점령 시 승리 조건 확인

## 주요 결정 / 맥락
- `stopClimbing(roomId, combo?)`: combo가 있으면 `calcClimbers`로 적용 후 board에 저장, 없으면 기존 climbers 그대로 사용 — 즉 첫 굴리기 후 바로 캠프해도 서버 로직은 정상 동작
- 버튼 disabled 조건: `mustSelectCombo`(주사위 나왔는데 아직 조합 미선택) OR (climbers도 없고 selectedCombo도 없음 = 굴리기 전)
- feat/m/cant-stop과 main이 동일 상태인지 확인 필요 (이전 세션까지는 매 수정마다 main 머지)

## 주의사항
- 아직 완전한 엔드투엔드 플레이(bust → 승리 조건까지)를 실제 두 기기로 테스트 안 함
- 배포 URL: https://jeonbyeongjae.github.io/JJangNol/
- GitHub Actions 배포 완료까지 몇 분 소요될 수 있음
