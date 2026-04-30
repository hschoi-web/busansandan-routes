# 부산산업단지 통근버스 통합 노선

부산산업단지(12개 단지)의 통근버스 노선을 한 화면에서 검색·확인할 수 있는 정적 웹페이지입니다.

- 좌측: 산단 → 지역 → 출/퇴근 트리
- 우측: 선택한 노선의 정류장 리스트 + 네이버 지도 + 실시간 차량 GPS 관제 (rideus.net `/map` 페이지 임베드)

## 구조

```
busansandan-routes/
├─ index.html              # 메인 페이지
├─ assets/
│  ├─ style.css
│  ├─ app.js
│  └─ logo.png
├─ data/
│  └─ routes.json          # 12개 산단 × 노선 × 정류장/시간표
└─ tools/
   ├─ generate-routes.mjs  # routes.json 자동 갱신 (Node 18+)
   └─ scrape-routes.html   # 브라우저용 수집기
```

## 로컬 실행

```bash
npx http-server -p 8765 -s --cors
```

브라우저에서 http://localhost:8765 접속.

## 데이터 갱신

[busansandan.rideus.net](https://busansandan.rideus.net)에서 노선이 변경되었을 때:

```bash
node tools/generate-routes.mjs
```

자동으로 `data/routes.json`을 최신 상태로 재생성합니다.

## 라이선스

내부 운영용. 데이터 출처: 부산경제진흥원 / (주)그라운드케이.
