# Hex Tile RPG Combat Prototype

육각형 타일 기반의 턴제 전투 RPG 프로토타입입니다. Three.js를 사용하여 3D로 구현되었으며, 모듈화된 구조로 쉽게 확장 가능합니다.

## 🎮 게임 소개

이 프로토타입은 육각형 그리드 위에서 플레이어와 적이 턴을 주고받으며 전투하는 전략적 RPG 게임입니다.

### 주요 특징
- **육각형 그리드 시스템**: 전략적인 위치 선정이 중요
- **턴제 전투**: 플레이어와 AI가 번갈아가며 행동
- **3D 비주얼**: Three.js를 활용한 입체적인 게임 화면
- **모듈화된 구조**: 기능별로 분리된 깔끔한 코드 구조

## 🚀 빠른 시작

### 요구사항
- 최신 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- 로컬 웹 서버 (ES6 모듈 사용을 위해 필요)

### 실행 방법

1. 저장소 클론
```bash
git clone [repository-url]
cd hex-tile-rpg
```

2. 로컬 서버 실행 (다음 중 하나 선택)
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (http-server 설치 필요)
npx http-server -p 8000

# VS Code Live Server 확장 사용
```

3. 브라우저에서 열기
```
http://localhost:8000
```

## 🎯 게임 방법

### 기본 조작
- **마우스 클릭**: 캐릭터 선택 및 이동
- **스페이스바**: 공격 모드 전환
- **ESC**: 선택 취소
- **마우스 드래그**: 카메라 이동/회전
- **마우스 휠**: 줌 인/아웃

### 게임 플레이
1. 플레이어 캐릭터(파란색)를 클릭하여 선택
2. 녹색으로 표시된 타일을 클릭하여 이동
3. 스페이스바를 눌러 공격 모드로 전환
4. 빨간색으로 표시된 적을 클릭하여 공격
5. 모든 적을 물리치면 승리!

## 🛠️ 기술 스택

- **Three.js**: 3D 그래픽 렌더링
- **JavaScript (ES6+)**: 모듈 시스템 활용
- **HTML5/CSS3**: UI 및 스타일링

## 📁 프로젝트 구조

```
hex-tile-rpg/
├── index.html              # 메인 HTML 파일
├── js/                     # JavaScript 모듈
│   ├── core/              # 핵심 시스템
│   │   ├── constants.js   # 게임 상수
│   │   ├── gameState.js   # 게임 상태 관리
│   │   └── sceneSetup.js  # Three.js 설정
│   ├── entities/          # 게임 엔티티
│   │   ├── HexTile.js     # 육각형 타일
│   │   └── Character.js   # 캐릭터
│   ├── systems/           # 게임 시스템
│   │   ├── gridSystem.js  # 그리드 관리
│   │   ├── combatSystem.js # 전투 시스템
│   │   ├── movementSystem.js # 이동 시스템
│   │   └── aiSystem.js    # AI 시스템
│   ├── controls/          # 입력 처리
│   │   ├── cameraControls.js # 카메라 컨트롤
│   │   └── inputHandler.js # 입력 핸들러
│   ├── ui/                # UI 컴포넌트
│   │   ├── combatLog.js   # 전투 로그
│   │   └── fpsCounter.js  # FPS 카운터
│   ├── utils/             # 유틸리티
│   │   ├── hexMath.js     # 육각형 수학
│   │   └── animation.js   # 애니메이션
│   └── main.js            # 메인 진입점
└── docs/                  # 문서
    ├── README.md          # 이 파일
    ├── ARCHITECTURE.md    # 아키텍처 설명
    ├── API.md            # API 문서
    ├── TUTORIAL.md       # 튜토리얼
    └── CONTRIBUTING.md   # 기여 가이드

```

## 🎨 스크린샷

[게임 스크린샷 추가 예정]

## 🤝 기여하기

프로젝트 개선에 관심이 있으시다면 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해주세요.

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🔗 관련 링크

- [Three.js 공식 문서](https://threejs.org/docs/)
- [육각형 그리드 가이드](https://www.redblobgames.com/grids/hexagons/)
- [게임 프로그래밍 패턴](https://gameprogrammingpatterns.com/)

---

Made with ❤️ using Three.js