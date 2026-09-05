# 계수중 PC방 좌석 예약 사이트

34석(1~5줄 6대씩, 6번째 줄 4대) 좌석 예약 웹사이트. 좌석을 예약하면 4자리 코드가 발급되고,
행사 당일 해당 좌석 PC에 그 코드를 입력하면 이용이 시작되는 방식입니다.

## 배포 방법 (GitHub + Vercel)

1. 이 폴더를 GitHub 저장소로 push
2. https://vercel.com 에서 New Project → 방금 만든 저장소 선택 → Deploy
3. **데이터 저장소 연결 (필수)**
   - Vercel 프로젝트 대시보드 → Storage 탭 → Create Database
   - 목록에서 **Upstash** (Upstash Redis) 선택 — 예전 "Vercel KV"가 이름만 Upstash로 바뀐 것으로, key-value 저장소는 동일합니다
   - Free 플랜으로 생성 → 프로젝트에 Connect
   - 연결하면 `KV_REST_API_URL`, `KV_REST_API_TOKEN` 환경변수가 자동으로 설정되어 `@vercel/kv` 코드가 코드 수정 없이 그대로 동작합니다
   - 연결 후 재배포(Redeploy) 한 번 해주세요
4. **관리자 키 설정 (권장)**
   - 프로젝트 Settings → Environment Variables → `ADMIN_KEY` = 원하는 비밀번호 추가
   - 설정 안 하면 관리자 페이지가 키 없이도 열립니다

## 사용 흐름

1. 학생들이 사이트에서 좌석 선택 → 학번·전화번호 입력 → 예약 → 4자리 코드 받음
2. 행사 전날, `admin.html`에서 관리자 키 입력 후 **JSON 다운로드**로 전체 예약 데이터 내려받기
3. 다운로드한 JSON 파일을 PC 관리 백엔드에 넣어서 사용 (좌석별 코드 검증에 그대로 활용 가능)

JSON 형식 예시:
```json
[
  { "seat": "3-2", "studentId": "20305", "phone": "01012345678", "code": "4821", "durationMinutes": 30, "createdAt": "2026-09-10T05:00:00.000Z" }
]
```

## 로컬 개발

```bash
npm install
npx vercel dev
```
`vercel dev`는 로컬에서 API 라우트까지 함께 띄워줍니다 (Vercel CLI 필요, `npm i -g vercel`).

## 나중에 정할 것

- 예약 가능 시간대(사전예약 오픈 기간, 당일 현장예약 방식)는 아직 미정이라 지금은 시간대 구분 없이 "선착순으로 코드 발급"만 되어 있습니다. 시간대별 예약이 필요해지면 `api/reserve.js`에 timeSlot 필드만 추가하면 됩니다.
