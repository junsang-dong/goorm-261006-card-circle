# Card Circle — 지인 기반 카드 거래 커뮤니티 기술명세서

버전 1.0 · 작성일 2026-10-06 · 작성 NextPlatform
가칭: 카드서클(Card Circle) · 한국어 UI · 통화 KRW

## 1. 제품 개요

한국의 카드 수집가와 지인들이 직접 보유 카드를 등록하고, 판매·교환 의사를 주고받는 초대 기반 커뮤니티를 만든다. 카드 사진·상태·희망 가격·문의 기록을 연결해 서로 거래를 진행할 수 있도록 돕는다.

**사용 흐름:** 초대 가입 → 카드 등록 → 검색·관심 저장 → 비공개 거래 문의 → 등록자의 예약 지정 → 당사자 간 거래 → 완료 표시.

앱의 역할은 매물 정보 공유와 거래 의사소통이다. MVP에서 앱은 대금을 보관하거나 결제·배송을 처리하지 않는다. 실제 거래 방식은 당사자가 합의한다. UI에 '직접 등록 정보', '등록자 희망 가격', '당사자 확인 거래 기록'을 명확히 표시한다.

- 외부 마켓 API·Apify·크롤러는 필수 기능이 아니다.
- 스포츠 카드 중심으로 시작하되 종목은 야구·농구·축구·기타를 지원한다. 이후 게임 카드 카테고리를 추가할 수 있다.
- 회원 정보와 카드 데이터는 회원들이 직접 제공한다. 기존 eBay JSON은 실제 회원의 소유 매물로 변환하거나 자동 등록하지 않는다.
- 첫 버전은 운영자가 초대한 소규모 커뮤니티 하나를 대상으로 한다. 공개 가입·다중 커뮤니티는 후속 범위다.

## 2. 기술 구성

| 영역 | 선택 | 목적 |
|---|---|---|
| Frontend | React + Vite + TypeScript | 화면·폼·탐색 |
| UI | Tailwind CSS, shadcn/ui 선택 | 모바일 중심 인터페이스 |
| 화면 라우팅 | React Router | 목록·상세·문의·내 정보 |
| 데이터 조회 | TanStack Query | API 캐시와 변경 후 갱신 |
| Backend | Vercel Functions, Node.js | 인증·권한·거래 상태·업로드 |
| Database | Neon Postgres + Drizzle | 회원·매물·문의·기록 |
| 사진 저장 | Vercel Blob private store | 회원 전용 사진 저장 |
| 검증 | Zod | 서버 입력 검증 |
| 소스·배포 | GitHub, Vercel | 소스 관리·실행 환경 |

브라우저는 `/api`를 호출한다. API 서버가 세션과 접근 권한을 확인한 뒤 Neon 및 사진 저장소에 접근한다. DB 접속 문자열과 Blob 토큰은 서버 전용이다. Neon에는 사진 바이너리·base64를 넣지 않는다.

## 3. 사용자·권한

| 역할 | 권한 |
|---|---|
| 비회원 | 로그인·초대 가입 화면만 접근 |
| 활성 회원 | 매물·커뮤니티 열람, 본인 매물 관리, 관심 저장·문의 |
| 매물 등록자 | 본인 문의 답변, 예약 대상 선택, 거래 완료·취소 |
| 운영자 | 초대 발급, 회원 정지, 신고 처리, 매물 숨김, 운영 공지 |

이메일·휴대폰 인증을 MVP 필수로 만들지 않는다. 초대 코드 + 로그인 ID + 비밀번호 + 닉네임으로 가입한다. 이는 실명 인증이나 거래 안전 보증을 의미하지 않는다.

- 초대 코드는 무작위 128bit 이상, DB에는 해시만 저장한다. 만료일·사용 가능 횟수·발급자를 기록한다.
- 가입 시 초대 사용 차감과 회원 생성은 동일 DB 트랜잭션이다. 동시 가입이 횟수를 초과하지 못하게 한다.
- login ID는 영문·숫자·밑줄 4~30자, 대소문자 정규화 후 UNIQUE. 닉네임 2~20자, 기본 UNIQUE.
- 비밀번호 10~128자, 서버 Node crypto scrypt + 무작위 salt로 저장한다. 원문 저장 금지.
- 세션은 무작위 토큰을 HttpOnly cookie로 발급하고 DB에는 토큰 해시를 저장한다. 초기 만료 7일, 정지·탈퇴 시 즉시 무효화한다.
- 로그인 오류는 계정 존재를 드러내지 않는 공통 메시지로 처리한다.
- 초기 운영자는 CLI bootstrap 명령으로 생성한다. seed가 공개 기본 비밀번호를 만들지 않는다.
- 비밀번호 분실은 운영자가 지인 여부를 외부에서 확인한 뒤 1회용 재설정 토큰 발급. 운영자는 기존 비밀번호를 볼 수 없다. reset 후 모든 기존 세션 폐기.

권한은 API에서 매번 검사한다. 숨긴 버튼만으로 권한을 구현하지 않는다. inquiry·message·image ID를 바꿔 타인의 비공개 기록에 접근할 수 없어야 한다.

## 4. MVP 범위

| 우선순위 | 기능 | 요구사항 |
|---|---|---|
| P0 | 초대 가입·로그인 | 회원별 데이터와 권한 분리 |
| P0 | 카드 등록·수정 | 사진, 카드 속성, 거래 유형, 상태, 희망 가격 |
| P0 | 매물 탐색 | 검색, 종목·유형·상태 필터, 최신·가격순 |
| P0 | 상세·관심 저장 | 상태 설명, 원본 사진, 등록자 프로필 요약 |
| P0 | 거래 문의 | 매물별 비공개 텍스트 대화, 읽음 표시 |
| P0 | 예약·완료 | 등록자 지정, 상대방 확인, 취소·재오픈 |
| P0 | 내 정보 | 등록 매물, 관심 목록, 문의, 거래 기록 |
| P0 | 신고·숨김 | 운영자 검토, 사유·조치 로그 |
| P1 | 자유게시판 | 카드 질문·수집 이야기·거래 팁·공지, 댓글 |
| P1 | 거래 후기 | 쌍방 확인 거래당 당사자별 1회 후기 |
| P1 | 앱 내 알림 | 새 문의·예약·완료 요청, 읽음 처리 |
| 후속 | 회원 추천·시세·AI | 데이터와 운영 피드백이 쌓인 후 별도 설계 |

첫 배포에서는 매물과 거래 문의를 커뮤니티의 핵심으로 삼는다. 공통 공개 Q&A 댓글은 P1로 둔다. 결제·에스크로·택배 API·WebSocket 실시간 채팅·자동 가격 추천·경매는 추가하지 않는다.

## 5. 화면·UX

모바일 하단 메뉴: `둘러보기 / 카드 등록 / 문의함 / 내 정보`. 커뮤니티 게시판은 P1에서 메뉴를 추가하거나 둘러보기 탭 안에 배치한다.

| 화면 | 구성 |
|---|---|
| 로그인·가입 | 초대 코드, 로그인 ID, 닉네임, 비밀번호, 운영 규칙 확인 |
| 둘러보기 | 검색, 종목 chips, 판매·교환·나눔, 가격 정렬, 상태 badge |
| 카드 상세 | 사진 갤러리, 속성, 상태·하자, 희망 가격, 배송·직거래, 관심·문의 버튼 |
| 카드 등록 | 사진 → 카드 정보 → 거래 조건 → 미리보기 → 등록 |
| 문의함 | 매물·상대 닉네임·최근 메시지·읽지 않은 수 |
| 문의 상세 | 텍스트 대화, 매물 상태, 등록자의 예약 지정·완료 요청 |
| 내 정보 | 내 매물·관심·진행 거래·완료 기록·비밀번호 변경 |
| 운영 관리 | 초대·신고·정지·숨김·감사 로그 |

첫 화면에서는 '지인들과 나누는 카드 컬렉션'과 카드 등록 행동을 강조한다. 데이터 출처/API 연결 같은 구현 세부사항을 일반 사용자 화면에 넣지 않는다.

상세 화면에 '가격과 상태는 등록자가 입력했습니다'를 표시한다. '인증 회원', '진품 보장', '안전 거래 보장' 표현은 실제 검증 기능 없이 사용하지 않는다. 판매 완료 표시만으로 공인 시세나 확인된 대금 지급으로 표현하지 않는다.

디자인: 밝은 배경·네이비 텍스트·블루 강조색, 카드 이미지 중심. 가격 `₩35,000`, 시간은 Asia/Seoul. 360px 화면에서 가로 스크롤 없이 사용 가능. 키보드 focus·폼 label·오류 설명·이미지 alt를 제공한다.

## 6. 카드 등록 필드

| 필드 | 필수 여부 | 규칙 |
|---|---|---|
| 제목 | 필수 | 5~100자 |
| 종목 | 필수 | baseball / basketball / soccer / other |
| 선수·인물 | 필수 | 1~100자 |
| 제조사·세트 | 선택 | 각각 100자 이하 |
| 시즌·발행 연도 | 선택 | 4자리, 서버 검증; 카드 번호와 분리 |
| 카드 번호 | 선택 | 문자열, 최대 50자, 앞자리 0 보존 |
| 패러렐·판본·언어 | 선택 | 같은 선수·번호의 다른 카드 구분 |
| 수량 | 고정 | MVP는 매물당 실제 카드 1장; bulk·box 제외 |
| 카드 상태 | 필수 | 등록자 평가: 새것에 가까움/양호/사용감/손상 |
| 상태·하자 설명 | 필수 | 10~2000자; 모서리·표면·스크래치 설명 |
| 등급 평가 여부 | 필수 | graded / ungraded |
| 감정기관·등급 | 조건부 필수 | graded일 때 필요, 등급은 문자열 |
| 인증번호 | 선택 | 기관 발급 번호; 존재 자체가 앱의 진품 검증 아님 |
| 거래 유형 | 필수 | sale / trade / giveaway |
| 희망 가격 | 조건부 | sale는 양의 정수 KRW; giveaway는 0; trade는 null |
| 교환 희망 조건 | 조건부 | trade일 때 필수 10~1000자 |
| 거래 방법 | 필수 | meetup / delivery / both |
| 직거래 지역 | 조건부 | 시·구 정도, 상세 주소 입력 유도 금지 |
| 배송비 | 선택 | 정수 KRW 또는 null(별도 협의), 무료는 명시적 0 |
| 사진 | 필수 | 최소 앞면·뒷면 2장, 최대 5장 |

자신이 보유하고 등록할 권리가 있는 실물 카드를 촬영했음을 등록 전 확인한다. 이미지에서 등급·가격·진품을 자동 추정하지 않는다. 수정 이력에 주요 상태·가격 변경을 기록하되 불필요한 개인정보 원문은 남기지 않는다.

## 7. 사진 업로드

회원 전용 플랫폼이므로 private Blob을 사용한다. 공개 URL의 난수성이 접근 권한을 대신하지 않는다.

1. 브라우저는 JPEG/PNG/WebP를 업로드 전 최대 긴 변 1600px, 장당 1.5MB로 압축한다.
2. 서버 업로드 API는 사진 1장씩 받는다. 함수 body 한도 내에서 multipart와 전체 용량을 검증한다. 원본 대용량을 API로 보내지 않는다.
3. 서버에서 실제 이미지 디코딩·픽셀 수(최대 20MP) 검증, EXIF 제거, WebP 재인코딩한다. 확장자·Content-Type만 믿지 않는다. SVG·애니메이션·임의 URL 가져오기는 제외한다.
4. 생성된 private 객체를 uploads에 owner_id·status=pending으로 기록하고 업로드 ID만 반환한다.
5. 매물 저장 시 본인의 pending 업로드만 연결한다. 저장 실패·미사용 업로드는 24시간 후 정리한다.
6. 사진 조회 API는 활성 회원과 매물 공개 상태를 확인하고 서버가 저장소에서 읽어 반환한다. MVP는 image proxy 방식, 응답 Cache-Control private,no-store.
7. 숨김·삭제 매물의 사진은 등록자 및 해당 신고 처리 운영자만 볼 수 있다. 회원 정지 시 이미지 조회도 차단한다.

회원당 초기 사진 저장 한도와 하루 업로드 한도를 서버에서 집계한다. 권장 초기값: 활성 매물 30개, 업로드 30장/일. 운영 설정으로 조정한다. 인증 없는 임의 Blob 업로드 엔드포인트는 만들지 않는다.

## 8. 문의와 거래 상태

### 8.1 문의

- 회원은 판매 중 매물에 본인 이외의 등록자에게 문의한다.
- `(listing_id, buyer_id)` 당 inquiry 1개, 기존 대화가 있으면 재사용한다.
- 문의·메시지는 해당 두 당사자만 접근한다. 운영자는 일반 문의함을 열람하지 않으며 신고에 연결된 내용만 별도 감사 로그와 함께 열람한다.
- 메시지 1~2000자, HTML 미지원, 첨부 제외. 연락처 공유는 공개 매물 설명 대신 비공개 대화에서 당사자가 선택한다.
- 열려 있는 문의 화면에서만 15초 polling, 숨겨진 탭에서 정지. last_read_message_id로 읽음 집계.
- 전송 client_message_id UNIQUE로 더블클릭·재시도 중복 방지.
- 예약 중에는 기존 문의 답변은 가능하고 새 거래 문의 시작은 막는다. 완료·취소 뒤에는 새 메시지를 막되 신고는 가능하다.

### 8.2 매물 상태와 거래 기록 분리

매물: `draft / available / reserved / completed / withdrawn`.
노출: `visible / hidden / deleted` 별도 필드. 운영자 숨김은 거래 진행 상태를 임의 완료로 바꾸지 않는다.
거래: `reserved / completion_requested / confirmed / disputed / cancelled`.

| 행동 | 권한·조건 | 결과 |
|---|---|---|
| 등록 | 작성자, 필수값 충족 | draft → available |
| 예약 지정 | 등록자, 해당 매물 문의자 선택 | available → reserved; trade 생성 |
| 예약 취소 | 등록자 또는 예약 상대방 | trade cancelled, listing available |
| 완료 요청 | 등록자, 유효 예약 존재 | trade completion_requested |
| 완료 확인 | 지정 상대방 | trade confirmed, listing completed |
| 완료 이의 제기 | 지정 상대방 | trade disputed, 매물 reserved 유지 |
| 재개 | 당사자 또는 운영자 정책에 따른 취소 | 취소 기록 후 available |
| 판매 철회 | 작성자 | 활성 거래 취소 처리 후 withdrawn |

- 지인과 앱 밖에서 거래한 경우 등록자가 '외부 거래 완료'를 표시할 수 있다. 거래 상태와 별개로 listing completed, completion_source=external로 기록하며 쌍방 확인 실적으로 집계하지 않는다.
- 완료 요청에는 거래 유형과 선택 합의 가격을 스냅샷으로 저장한다. 합의 가격은 buyer 확인 이후에만 확정한다. 교환·나눔에 판매 금액을 강제하지 않는다.
- 합의 가격은 기본 비공개이며 당사자만 열람한다. 희망 가격은 매물에 표시한다. 시세 집계 공개는 후속 정책·동의 범위다.
- 예약·완료 전환은 DB 트랜잭션과 조건부 update 또는 row lock으로 처리한다. 하나의 매물에는 활성 거래가 최대 1개라는 partial unique 제약을 둔다.
- 두 등록 요청의 경쟁에서 하나만 성공하며 나머지는 409를 반환한다. optimistic locking version으로 이전 화면의 stale 변경을 막는다.
- 예약 이후 상품 정보·가격·사진 변경은 막고 예약 취소 후 수정하도록 한다. 거래 시점 스냅샷과 원본을 다르게 만들지 않는다.
- 완료·숨김·삭제는 대금 지급·배송·진위 확인의 증거로 표시하지 않는다.

## 9. Neon 데이터 모델

모든 ID는 UUID, 시각은 timestamptz UTC 저장. 원화 금액은 integer(앱 최대 1억원)로 제한한다. DB migration에 enum/check/index/foreign key를 포함한다.

| 테이블 | 주요 필드·제약 |
|---|---|
| users | login_id UNIQUE, nickname, password_hash, role, status, joined_at |
| invites | code_hash UNIQUE, issuer_id, expires_at, max_uses, used_count, revoked_at |
| sessions | token_hash UNIQUE, user_id, expires_at, revoked_at |
| password_resets | token_hash, user_id, expires_at, used_at |
| listings | owner_id, 카드 필드, transaction_type, asking_price, status, visibility, version, completion_source |
| uploads | owner_id, object_path, mime, byte_size, status, created_at |
| listing_images | listing_id, upload_id UNIQUE, position |
| favorites | user_id + listing_id UNIQUE |
| inquiries | listing_id + buyer_id UNIQUE, seller_id, participant별 last_read_message_id |
| messages | inquiry_id, sender_id, body, client_message_id, created_at; sender+client ID UNIQUE |
| trades | listing_id, inquiry_id, seller_id, buyer_id, status, snapshot JSONB, agreed_price, timestamps |
| listing_events | listing_id, actor_id, event_type, minimal payload, created_at |
| reports | reporter_id, listing/message/user 대상, 사유, status, assigned_admin, resolution |
| admin_audit_logs | admin_id, action, target_id, reason, created_at |
| rate_limit_buckets | scope_key, window_start, count; 원자적 증가 |

P1 추가: posts, comments, reviews, notifications.

필수 인덱스: listings(status,visibility,created_at,id), listings(sport,asking_price), inquiries(buyer_id), inquiries(seller_id), messages(inquiry_id,created_at,id), reports(status,created_at).
초기 검색은 파라미터화한 ILIKE를 사용한다. 한국어 검색을 영문 full-text 검색에 억지로 매핑하지 않는다. 규모 증가 시 pg_trgm 도입을 별도 검토한다.

## 10. API 계약

| Method / 경로 | 기능 |
|---|---|
| POST /api/auth/register | 초대 검증·가입, transaction |
| POST /api/auth/login, logout | 세션 발급·폐기 |
| GET /api/me | 본인 최소 프로필 |
| PATCH /api/me | 닉네임 변경 |
| POST /api/me/password | 현재 비밀번호 검증 후 변경·기존 세션 폐기 |
| POST /api/auth/reset-password | 운영자가 발급한 reset 토큰 사용 |
| GET /api/listings | 필터·검색·cursor 목록 |
| POST /api/listings | 본인 소유 업로드와 매물 저장 |
| GET/PATCH/DELETE /api/listings/:id | 상세·소유자 수정·삭제 |
| POST /api/uploads | 이미지 1장 업로드 |
| DELETE /api/uploads/:id | 본인 미연결 사진 제거 |
| GET /api/images/:id | 인증·가시성 검사 후 private 사진 반환 |
| PUT/DELETE /api/listings/:id/favorite | 멱등 관심 저장·취소 |
| POST /api/listings/:id/inquiries | 문의 생성·기존 반환 |
| GET /api/inquiries | 본인이 당사자인 문의만 |
| GET/POST /api/inquiries/:id/messages | 당사자 대화 조회·전송 |
| POST /api/inquiries/:id/read | 본인 읽음 지점 갱신 |
| POST /api/listings/:id/reserve | 등록자가 inquiry_id 지정 |
| POST /api/trades/:id/cancel | 당사자 취소 |
| POST /api/trades/:id/request-completion | 등록자의 완료 요청 |
| POST /api/trades/:id/confirm, dispute | 상대방 확인·이의 제기 |
| POST /api/listings/:id/external-complete | 외부 거래 완료 표시 |
| POST /api/reports | 회원 신고 |
| POST /api/admin/invites | 운영자 초대 발급·최초 응답에만 원문 코드 |
| POST /api/admin/password-resets | 운영자 reset 코드 발급 |
| PATCH /api/admin/users/:id/status | 회원 정지·해제 |
| PATCH /api/admin/listings/:id/visibility | 숨김·복구, 사유 필수 |
| GET/PATCH /api/admin/reports/:id | 신고 근거 검토·조치 기록 |
| POST /api/maintenance/cleanup | Cron secret으로 미사용 사진·만료 세션 정리 |

목록 기본 20건·최대 50건, cursor는 created_at+id. 허용된 sort enum만 사용한다. 성공 `{data, meta}`; 실패 `{error:{code,message},requestId}`. 401 비로그인, 403 권한 없음, 404 비공개 대상, 409 예약 충돌·version mismatch, 422 검증 오류, 429 요청 제한.

메시지·거래 API는 로그인뿐 아니라 해당 매물·문의의 참여 여부도 확인한다. 요청 owner_id·sender_id를 믿지 않고 세션에서 계산한다. 예약 상대방 ID는 서버가 inquiry에서 계산한다.

## 11. 회원·운영 보호

- 기본 열람은 활성 회원 전용. 검색엔진 색인 차단은 보조이며 API 인증을 대신하지 않는다.
- 변경 요청은 Origin 검증·CSRF 방어; 쿠키 Secure/HttpOnly/SameSite 설정. localhost 개발 설정은 배포와 분리.
- 초기 서버 rate limit: 로그인 5회/15분/IP, 등록 10회/일/회원, 문의 시작 20회/일/회원, 메시지 30회/분/회원. DB에서 공유 집계해 서버리스 인스턴스별 차이를 피한다. 운영자 조정 가능.
- 탈퇴는 세션 폐기·매물 숨김부터 처리하고 본인 정보 삭제·익명화 작업을 제공한다. 메시지·거래·신고 기록의 보관 및 당사자 열람 정책은 운영 규칙에 명시하며 무기한 보관을 기본으로 하지 않는다.
- 신고 사유: 상태 불일치, 도용 사진, 허위 정보, 스팸, 거래 분쟁, 기타. 신고는 사실 판정이 아니며 운영자가 기록을 확인해 조치한다.
- 개인 주소·전화번호·계좌번호를 공개 매물에 입력하도록 유도하지 않는다. 마케팅 메시지 자동 전송은 구현하지 않는다.
- 운영자 조치는 사유와 actor를 남긴다. 관리자 권한으로 매물 판매 가격·거래 상대를 임의 수정하지 않는다.
- 사용자 문자열 escaping, parameterized SQL, 업로드 검증, 비밀값 로그 마스킹 적용.

## 12. 샘플 데이터·30분 수업 범위

### 12.1 데모 seed

개발 모드 전용 회원 5명·매물 20개·문의 6개·거래 3개. 야구 8·농구 6·축구 4·기타 2, 판매·교환·나눔과 예약·완료 예시를 포함한다. 사진은 독립 제작 플레이스홀더. 가상 매물과 가격은 화면에 데모로 표시한다. Production seed 명령은 거부한다.

### 12.2 30분 프로토타입과 운영 MVP 구분

30분은 실제 다중 사용자 운영 시스템 전체의 완성 시간이 아니라 UX 시연 목표다. `demo` 모드는 고정 데모 회원과 localStorage로 거래 흐름을 시뮬레이션하고 '데모: 이 브라우저에만 저장'을 표시한다. 데모 계정 선택을 운영 로그인 기능으로 배포하지 않는다.

| 시간 | 프로토타입 작업 |
|---|---|
| 0~5분 | React/Vite 구조·샘플 매물·공통 타입 |
| 5~12분 | 목록·검색·상세·모바일 UI |
| 12~20분 | 카드 등록 폼·로컬 사진 미리보기·관심 저장 |
| 20~26분 | 문의 및 예약·완료의 데모 상태 전환 |
| 26~30분 | 새로고침 보존·입력 오류·빌드·시연 |

운영 MVP는 초대 가입·Neon 영속 저장·사진 저장·개인별 권한·동시 예약·신고 검증까지 구현한 뒤 별도 배포한다. 로컬 시뮬레이션 완료를 실제 회원 간 거래 기능 완료라고 보고하지 않는다.

## 13. 프로젝트·환경변수·배포

```text
src/
  app/
  features/auth/
  features/listings/
  features/inquiries/
  features/trades/
  features/profile/
  features/admin/
  components/
  lib/api-client.ts
  types/
api/                       # Vercel HTTP handlers
server/
  auth/
  permissions/
  listings/
  inquiries/
  trades/
  storage/
  db/
drizzle/
scripts/bootstrap-admin.ts
scripts/seed-demo.ts
tests/
.env.example
vercel.json
README.md
```

```dotenv
DATABASE_URL=
BLOB_READ_WRITE_TOKEN=
SESSION_SECRET=
CRON_SECRET=
APP_ORIGIN=http://localhost:3000
APP_MODE=demo
```

비밀값은 서버 환경변수에 저장한다.

- `.env.example`에 실제 값을 기록하지 않는다. 비밀값에 `VITE_` 접두사를 붙이지 않는다.
- API와 화면의 로컬 포트에 맞게 APP_ORIGIN을 설정한다.
- 필수 scripts: dev, build, typecheck, test, db:generate, db:migrate, seed:demo, bootstrap:admin.
- 전체 로컬 실행은 `vercel dev`, 화면 개발은 `npm run dev`를 사용한다.
- Vercel SPA fallback은 화면 경로에만 적용한다. `/api`를 index.html로 rewrite하지 않는다.
- Preview/Production의 Neon branch·Blob store·비밀값을 분리한다.
- Production APP_MODE=live에서는 데모 인증·seed·localStorage 기반 공유 데이터를 사용하지 않는다.
- 배포 전 DB migration, private Blob 설정, 관리자 생성, 초대, 권한 테스트를 완료한다.

## 14. 인수 기준과 테스트

| 시나리오 | 통과 조건 |
|---|---|
| 초대 | 무효·만료 거부, 동시 사용에도 횟수 상한 유지 |
| 회원 2명 | A가 등록한 매물을 B가 다른 브라우저에서 검색·열람 가능 |
| 사진 | 앞·뒷면 2장 필수, 이미지 위장 거부, 비회원 접근 불가 |
| 권한 | B는 A의 카드 수정 불가, C는 A/B의 문의 열람 불가 |
| 문의 | 재전송·더블클릭에도 중복 메시지 없음 |
| 예약 경쟁 | 동시 요청에도 활성 예약·거래는 1개 |
| 완료 | 지정 상대방만 완료 확인 가능 |
| 가격 | 판매·교환·나눔 규칙 준수, 희망 가격·합의 가격 분리 |
| 삭제·정지 | 숨긴 사진·API 접근 차단, 정지 회원의 기존 세션 무효 |
| 영속성 | live에서 재시작·다른 기기에도 DB 데이터 유지 |
| 사용성 | 360px에서 등록·문의 가능, 필수값 오류 명확 |
| 배포 | typecheck/test/build 통과, 브라우저 번들에 비밀값 없음 |

권한·예약 경쟁·초대 소모·상태 전환·사진 소유권·메시지 멱등성을 중심으로 테스트한다. Neon 통합 테스트는 분리 DB에서 실행한다. 사진 저장과 DB 저장 사이의 실패가 pending 업로드와 cleanup으로 복구되는지 확인한다.

## 15. 구현 순서와 산출물

1. 데모 등록·탐색·문의 UX.
2. DB schema/migrations·초대·세션·권한.
3. 매물 CRUD·private 사진·검색·관심 저장.
4. 비공개 문의·polling·읽음 위치.
5. 원자적 예약·취소·상호 완료·외부 완료.
6. 초대 관리·신고 처리·회원 정지·cleanup.
7. 통합 테스트·README·GitHub·Vercel 배포.
8. 사용자 피드백 후 게시판·후기·알림.

코딩 에이전트는 실행 가능한 전체 소스, SQL migration, demo seed, `.env.example`, README, 핵심 테스트를 제공한다. 미구현 기능은 명시한다. 사용자 제공 데이터를 중심으로 새 프로젝트를 구현하며, 이전 eBay 수집기의 인증·수집 기능을 의존성으로 가져오지 않는다.

Footer: `Developed by Jun · NextPlatform | React · Vite · TypeScript · Vercel / Built with Codex · SPEC with ChatGPT | Version 1.0.0 · © 2026`.

## 16. 기술 참고

- Vercel Blob: https://vercel.com/docs/vercel-blob
- Private storage: https://vercel.com/docs/vercel-blob/private-storage
- Neon serverless driver: https://github.com/neondatabase/serverless

구현 시 최신 SDK의 private store 지원과 Vercel Functions의 요청 용량·실행 시간 제한을 확인하고 본 문서의 설계 상한과 일치시킨다.
