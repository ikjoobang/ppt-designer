# PPT Professional Designer System

> AI 기반 맞춤형 PowerPoint 템플릿 추천 시스템

전략적 질문을 통해 사용자의 요구사항을 분석하고, 최적의 PPT 템플릿과 구현 전략을 제공하는 웹 서비스입니다.

## 🎯 주요 기능

### 1. **5단계 전략적 워크플로우**
- **Phase 1**: 콘텐츠 심층 분석
- **Phase 2**: 템플릿 선호도 발견
- **Phase 3**: 슬라이드 구조 설계
- **Phase 4**: 기술 최적화
- **Phase 5**: 실행 전략 수립

### 2. **AI 기반 맞춤 추천**
- 가중치 기반 스코어링 시스템
- 실시간 진행률 추적
- 맞춤형 개발 방향 제시

### 3. **템플릿 매칭 알고리즘**
- 스타일, 색상, 기능, 호환성 기반 매칭
- 100점 만점 매칭 점수 계산
- 장단점 분석 및 난이도 평가

---

## 🏗️ 프로젝트 구조

```
webapp/
├── index.html                    # 메인 HTML 파일
├── public/                       # 정적 파일
│   ├── ppt_designer_frontend.js # React 프론트엔드 로직
│   └── ppt_designer_styles.css  # Beige/Orange 테마 스타일
├── api/                          # Vercel Serverless Functions
│   ├── index.py                 # Flask API 엔드포인트
│   ├── requirements.txt         # Python 의존성
│   └── ppt_designer_system.json # 질문 및 설정 데이터
├── vercel.json                   # Vercel 배포 설정
├── package.json                  # 프로젝트 메타데이터
└── .gitignore                    # Git 제외 파일
```

---

## 🚀 배포 방법

### ⚠️ 중요: Netlify는 지원되지 않습니다

이 프로젝트는 **Python Flask 백엔드**를 사용하므로 Netlify(정적 호스팅)로는 배포할 수 없습니다.

### ✅ 추천 배포 방법: Vercel

#### **1단계: GitHub에 코드 푸시**

```bash
# GitHub 저장소 생성 후
git remote add origin https://github.com/YOUR_USERNAME/ppt-designer.git
git branch -M main
git push -u origin main
```

#### **2단계: Vercel에 배포**

1. [Vercel](https://vercel.com) 접속 및 로그인
2. "New Project" 클릭
3. GitHub 저장소 선택 (`ppt-designer`)
4. 프로젝트 설정:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: (비워둠)
   - **Output Directory**: (비워둠)
5. "Deploy" 클릭

#### **3단계: 배포 완료**

- 배포 URL: `https://your-project.vercel.app`
- API 엔드포인트: `https://your-project.vercel.app/api/questions`

---

## 🔧 로컬 개발

### **프론트엔드 개발**

```bash
# 간단한 HTTP 서버로 실행
python -m http.server 3000

# 브라우저에서 http://localhost:3000 접속
```

### **백엔드 개발**

```bash
# 가상환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
cd api
pip install -r requirements.txt

# Flask 서버 실행
python index.py

# API 테스트
curl http://localhost:5000/api/questions
```

---

## 📡 API 엔드포인트

### **1. 모든 질문 가져오기**
```
GET /api/questions
```

### **2. Phase별 질문 가져오기**
```
GET /api/questions/phase/{phase_id}
```

### **3. 사용자 응답 제출**
```
POST /api/responses
Body: {
  "question_id": "q1.1.1",
  "response": "교육",
  "additional_details": "대학교 강의자료"
}
```

### **4. 프로필 점수 계산**
```
GET /api/profile/score
```

### **5. 템플릿 추천**
```
GET /api/recommendations
```

### **6. 구현 계획 생성**
```
GET /api/implementation-plan
```

### **7. 진행률 확인**
```
GET /api/progress
```

---

## 🎨 디자인 시스템

### **색상 테마: Beige/Orange**

- **Primary Background**: `#FAF7F0` (Cream)
- **Secondary Background**: `#F5EFE7` (Light Beige)
- **Accent Primary**: `#E67E22` (Orange)
- **Accent Secondary**: `#D35400` (Dark Orange)
- **Text Primary**: `#2C2416` (Dark Brown)

### **폰트**

- **Primary Font**: Pretendard (Korean)
- **Weights**: 400 (Regular), 600 (SemiBold), 700 (Bold)

---

## 📦 기술 스택

### **프론트엔드**
- React 18 (CDN)
- Babel Standalone (JSX 변환)
- Pretendard Font

### **백엔드**
- Python 3.9+
- Flask 3.0.0
- Flask-CORS 4.0.0

### **배포**
- Vercel (Serverless Functions)
- GitHub (버전 관리)

---

## 🔒 환경 변수

현재 환경 변수 필요 없음. 모든 설정은 `ppt_designer_system.json`에 저장됨.

---

## 📝 현재 완성된 기능

✅ 5단계 전략적 질문 시스템  
✅ 사용자 응답 저장 및 관리  
✅ 프로필 점수 계산  
✅ 템플릿 매칭 알고리즘  
✅ 구현 계획 자동 생성  
✅ 진행률 추적  
✅ Beige/Orange 테마 UI  

---

## 🚧 아직 구현되지 않은 기능

⏳ 실제 템플릿 데이터베이스 연동  
⏳ 사용자 인증 및 세션 관리  
⏳ 프로필 저장 및 불러오기  
⏳ 템플릿 미리보기 기능  
⏳ 다국어 지원 (영어)  

---

## 🎯 추천 다음 개발 단계

1. **사용자 세션 관리**: 브라우저 localStorage 또는 JWT 토큰
2. **실제 템플릿 DB**: Microsoft Office Templates API 연동
3. **프로필 저장**: Vercel KV 또는 Firebase 연동
4. **템플릿 미리보기**: iframe 또는 이미지 모달
5. **반응형 디자인**: 모바일/태블릿 최적화

---

## 📄 라이선스

MIT License

---

## 👨‍💻 개발자

PPT Designer Team

---

## 📮 문의

프로젝트 이슈는 GitHub Issues에 등록해주세요.

---

**마지막 업데이트**: 2025-11-07  
**배포 상태**: ⏳ 준비 중  
**버전**: 1.0.0
