# 티켓 인식 서버

Vercel 등에 `server/recognize` 폴더를 따로 배포하고 `ANTHROPIC_API_KEY` 환경 변수를 설정합니다.
앱에는 `EXPO_PUBLIC_RECOGNIZE_URL=https://<배포 주소>/api/recognize` 만 넣습니다. 비워 두면 앱은 예시 결과를 사용합니다.
