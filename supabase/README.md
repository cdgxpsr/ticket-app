# Supabase (냥냥수첩)

Project: `dvrznqbtjwksthzqxnpq` — https://dvrznqbtjwksthzqxnpq.supabase.co

- `migrations/` deploy automatically via the Supabase GitHub integration when merged to `main`.
- `functions/recognize/` (ticket recognition, Claude `claude-sonnet-5-5`) must be deployed manually (below).

## One-time setup

1. **Enable anonymous sign-ins** — Dashboard → Authentication → Sign In / Providers → *Allow anonymous sign-ins* → ON → Save.
   (Recommended: also enable CAPTCHA / Turnstile under Authentication → Attack Protection to limit anonymous-account abuse.)
2. **Set the Anthropic key as a function secret** (never commit it):
   ```sh
   npx supabase login
   npx supabase link --project-ref dvrznqbtjwksthzqxnpq
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
   ```
   (or Dashboard → Edge Functions → Secrets → add `ANTHROPIC_API_KEY`.)
3. **Deploy the function** (JWT verification stays on; the app sends the anonymous user's JWT):
   ```sh
   npx supabase functions deploy recognize --project-ref dvrznqbtjwksthzqxnpq
   ```
4. Merge the PR to `main` so the migration runs (tables, RLS, `tickets` storage bucket, signup trigger, `claim_invite`).
   To apply without merging: `npx supabase db push`.

## App config

`.env` (copy from `.env.example`): `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (publishable key, public).
`EXPO_PUBLIC_USE_LOCAL=1` switches to the on-device `localRepo` (offline/dev). If the function errors, the app falls back to mock recognition.

## 로그인 설정

앱은 처음엔 익명으로 시작하고, 친구 추가·후기·글·댓글·초대 보상 같은 소셜 동작을 처음 할 때 로그인 시트를 띄워요.
카카오/Google은 익명 계정에 **identity를 연결(linkIdentity)** 하므로 로그인 전에 만든 티켓이 그대로 남아요.
Apple은 `signInWithIdToken`이 익명 계정에 연결되지 않아 새 계정으로 로그인한 뒤 `merge_anonymous(old_uid)` RPC로 데이터를 옮겨요.

공통 Redirect(콜백) URI: `https://dvrznqbtjwksthzqxnpq.supabase.co/auth/v1/callback`

### 0. Supabase 기본 설정
1. Supabase 대시보드 → Authentication → Sign In / Providers → **Allow anonymous sign-ins** 켜기(이미 켜져 있음).
2. 같은 화면에서 **Allow manual linking** 켜기 — `linkIdentity`에 필요해요. (CLI: `config.toml`의 `[auth] enable_manual_linking = true`)
3. Authentication → URL Configuration → **Redirect URLs**에 `nyangsucheop://auth-callback` 추가 (개발 중 Expo Go는 `exp://**`도 추가).

### 1. 카카오
1. https://developers.kakao.com → 내 애플리케이션 → **애플리케이션 추가하기** (앱 이름: 냥냥수첩).
2. 앱 설정 → 앱 키에서 **REST API 키** 복사.
3. 제품 설정 → 카카오 로그인 → **활성화 ON**, **Redirect URI**에 위 콜백 URI 등록.
4. 카카오 로그인 → 보안 → **Client Secret 코드 생성** 후 활성화 상태를 "사용함"으로.
5. 카카오 로그인 → 동의항목: 닉네임, 프로필 사진, 카카오계정(이메일) 설정 (이메일은 비즈 앱 전환 필요할 수 있음).
6. Supabase → Authentication → Providers → **Kakao** 켜기 → Client ID = REST API 키, Client Secret = 위 시크릿 → 저장.

### 2. Google
1. https://console.cloud.google.com → 프로젝트 선택/생성 → API 및 서비스 → **OAuth 동의 화면** 구성(외부, 앱 이름·지원 이메일).
2. 사용자 인증 정보 → **OAuth 클라이언트 ID 만들기** → 유형 **웹 애플리케이션**.
3. 승인된 리디렉션 URI에 위 콜백 URI 추가 → 클라이언트 ID / 보안 비밀 복사.
4. Supabase → Providers → **Google** 켜기 → Client ID, Client Secret 입력 → 저장.

### 3. Apple (iOS 필수: 소셜 로그인을 제공하면 App Store 심사상 Apple 로그인도 필요)
1. https://developer.apple.com → Certificates, Identifiers & Profiles → Identifiers → App ID `com.nyangsucheop.app`에서 **Sign In with Apple** 체크.
2. (네이티브 iOS만 쓰면 이걸로 충분) Supabase → Providers → **Apple** 켜기 → Client IDs에 `com.nyangsucheop.app` 입력.
3. (웹/안드로이드에서도 쓰려면) Identifiers → **Services ID** 생성(예: `com.nyangsucheop.app.signin`), Sign In with Apple 설정에서 도메인 `dvrznqbtjwksthzqxnpq.supabase.co`, Return URL에 위 콜백 URI.
   Keys → 새 키 생성, Sign In with Apple 체크 → `.p8` 다운로드, Key ID·Team ID 메모 → Supabase Apple 설정에 Services ID와 시크릿(.p8로 생성한 JWT, 6개월마다 갱신) 입력, Client IDs에 Services ID도 추가.
4. `app.json`에 `ios.usesAppleSignIn: true`와 `expo-apple-authentication` 플러그인이 들어 있어요. 개발 빌드(`eas build`)로 테스트하세요(Expo Go 불가).

### 4. 마이그레이션
`20261003010000_merge_anonymous.sql`이 적용돼야 Apple 로그인 시 익명 데이터가 옮겨져요 (`npx supabase db push`).
제약: 호출자가 방금(10분 이내) 로그인한 비익명 사용자이고 `old_uid`가 익명 사용자일 때만 동작하며, 이전 익명 계정은 삭제돼요.

## 지역별 문화거리 (culture_events 동기화)

`sync-culture` 엣지 함수가 매일 새벽 4시(KST) 아래 공공 API에서 영화·공연·전시·축제·액티비티를 가져와 `public.culture_events`에 저장해요. 키가 없는 소스는 건너뛰고, 테이블이 비어 있으면 앱은 예시 데이터를 보여줘요.

### 1. API 키 발급
- **KOBIS_KEY** (영화 박스오피스): https://www.kobis.or.kr/kobisopenapi → 회원가입 → 키 발급/관리 → **오픈API 키 발급**.
- **KOPIS_KEY** (공연): https://www.kopis.or.kr → 공연예술통합전산망 **오픈API 신청** → 승인 후 서비스키 확인.
- **TOUR_API_KEY** (축제·전시·레포츠): https://www.data.go.kr → '**한국관광공사_국문 관광정보 서비스_GW**' 검색 → 활용신청 → 마이페이지에서 일반 인증키(**Decoding** 키 권장) 복사.

### 2. 마이그레이션
`npx supabase db push` (또는 SQL Editor에서 `migrations/20261004000000_culture_events.sql` 실행).

### 3. 시크릿 설정 & 함수 배포
```bash
npx supabase secrets set KOBIS_KEY=... KOPIS_KEY=... TOUR_API_KEY=... SYNC_SECRET=$(openssl rand -hex 24)
npx supabase functions deploy sync-culture --no-verify-jwt
# 수동 실행 테스트
curl -X POST https://dvrznqbtjwksthzqxnpq.supabase.co/functions/v1/sync-culture -H "x-sync-secret: <SYNC_SECRET>"
```
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 자동 제공돼요.

### 4. 매일 자동 실행
Dashboard → Database → Extensions에서 `pg_cron`, `pg_net`을 켠 뒤, 마이그레이션 파일 하단의 주석 처리된 `cron.schedule(...)` SQL을 `<SYNC_SECRET>`만 바꿔 SQL Editor에서 실행하세요 (UTC 19:00 = KST 04:00).
