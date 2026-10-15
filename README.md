# 탐구온 (TAMGU ON)

모바일 브라우저에서 사용하는 수행평가 일정 관리 웹앱입니다.

## 구성 파일
- `index.html`: 화면 구조
- `styles.css`: 디자인
- `app.js`: 회원가입/로그인/과제 기능
- `config.js`: Supabase 접속 설정
- `supabase_schema.sql`: 과제 테이블 및 RLS 정책

## 설정 순서
1. Supabase 프로젝트에서 Project URL과 Publishable key를 확인합니다.
2. `config.js`에서 `PASTE_...` 문구를 본인의 값으로 바꿉니다.
3. GitHub 저장소의 **루트 폴더**에 위 5개 파일을 업로드합니다. `config.js`는 PDF가 아니라 실제 `.js` 파일이어야 합니다.
4. Supabase SQL Editor에서 `supabase_schema.sql` 내용을 실행합니다. 이미 동일한 테이블/정책이 있다면 현재 설정을 확인한 뒤 실행하세요.
5. Supabase Authentication 설정에서 Email provider가 활성화되어 있는지 확인합니다. Confirm email이 켜져 있으면 가입 후 이메일 인증이 필요할 수 있습니다.
6. GitHub 저장소의 Settings → Pages에서 `main` 브랜치와 `/(root)` 폴더를 배포 대상으로 선택합니다.
7. Pages의 Visit site를 눌러 테스트합니다.

## 보안
- `config.js`에는 Project URL과 **Publishable key**만 사용하세요.
- `service_role` 또는 `sb_secret_` 키를 프런트엔드에 넣지 마세요.
- Publishable key는 클라이언트에 사용하도록 설계되어 있지만, 데이터 보안은 RLS 정책에 의존합니다.
- 비밀번호와 개인 키를 채팅에 공유하지 마세요.

## 참고
이 프로젝트는 GitHub Pages에서 실행되는 정적 웹앱입니다. 실제 로그인/저장 기능은 사용자의 Supabase 프로젝트 설정에 의존하므로, 배포 후 회원가입/로그인을 직접 테스트해야 합니다.
