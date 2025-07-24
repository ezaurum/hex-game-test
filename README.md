# Hex Tile RPG Combat Prototype

헥스 타일 기반의 턴제 전술 RPG 전투 프로토타입입니다. Three.js와 모듈러 아키텍처를 사용하여 구현되었습니다.

## 주요 기능

### 전투 시스템
- **턴제 전투**: 플레이어와 적이 번갈아가며 행동
- **이동 시스템**: 캐릭터당 3칸까지 이동 가능 (남은 이동력 표시)
- **공격 시스템**: 근접 공격 (사거리 1칸)
- **애니메이션**: 이동, 공격, 피격, 대기 애니메이션
- **방향 전환**: 캐릭터가 이동 방향과 공격 대상을 바라봄

### 시각적 기능
- **3D 그래픽**: Three.js 기반 3D 렌더링
- **GLTF 모델**: 애니메이션이 포함된 3D 캐릭터 모델
- **파티클 효과**: 클릭 시 파티클 효과
- **체력바 UI**: 캐릭터 머리 위 2D 체력바
- **하이라이트**: 이동/공격 가능 타일 표시

### UI/UX
- **카메라 컨트롤**: 마우스 드래그로 회전, 휠로 줌, 키보드로 이동
- **캐릭터 선택**: 클릭으로 캐릭터 선택 및 행동
- **전투 로그**: 실시간 전투 기록 표시
- **FPS 카운터**: 성능 모니터링

### AI 시스템
- **적 AI**: 가장 가까운 플레이어를 추적하여 공격
- **경로 찾기**: A* 알고리즘 기반 최적 경로 탐색

## 기술 스택

- **Three.js**: 3D 그래픽 렌더링
- **Vite**: 빌드 도구 및 개발 서버
- **ES6 Modules**: 모듈러 JavaScript 아키텍처
- **GLTF**: 3D 모델 및 애니메이션

## 프로젝트 구조

```
hex-game-test/
├── index.html          # 메인 HTML 파일
├── main.js            # 진입점 (Vite용)
├── js/
│   ├── main.js        # 게임 초기화 및 메인 루프
│   ├── core/          # 핵심 시스템
│   │   ├── constants.js    # 게임 상수
│   │   ├── gameState.js    # 게임 상태 관리
│   │   └── sceneSetup.js   # Three.js 씬 설정
│   ├── entities/      # 게임 엔티티
│   │   ├── Character.js    # 캐릭터 클래스
│   │   └── HexTile.js      # 헥스 타일 클래스
│   ├── systems/       # 게임 시스템
│   │   ├── gridSystem.js   # 헥스 그리드 관리
│   │   ├── movementSystem.js # 이동 시스템
│   │   ├── combatSystem.js  # 전투 시스템
│   │   └── aiSystem.js      # AI 시스템
│   ├── controls/      # 입력 제어
│   │   ├── inputHandler.js  # 마우스/키보드 입력
│   │   └── cameraControls.js # 카메라 제어
│   ├── ui/            # UI 컴포넌트
│   │   ├── healthBarUI.js   # 체력바 UI
│   │   ├── combatLog.js     # 전투 로그
│   │   └── fpsCounter.js    # FPS 표시
│   └── utils/         # 유틸리티
│       └── animation.js     # 애니메이션 헬퍼
├── public/
│   └── RobotExpressive/     # 3D 모델 파일
└── package.json       # 프로젝트 의존성
```

## 설치 및 실행

### 요구사항
- Node.js 14 이상
- npm 또는 yarn

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

## 게임 조작법

### 마우스
- **좌클릭**: 캐릭터 선택, 이동, 공격
- **우클릭 + 드래그**: 카메라 회전
- **휠**: 줌 인/아웃

### 키보드
- **방향키/WASD**: 카메라 이동
- **+/-**: 줌 인/아웃
- **Space**: 공격 모드 토글
- **ESC**: 선택 취소

## 게임플레이

1. **캐릭터 선택**: 플레이어 캐릭터(파란색)를 클릭
2. **이동**: 녹색으로 표시된 타일을 클릭하여 이동 (최대 3칸)
3. **공격**: Space키로 공격 모드 전환 후 빨간색 타일의 적 클릭
4. **턴 종료**: 모든 캐릭터가 행동하면 자동으로 적 턴 시작

## 개발 가이드

### 새로운 기능 추가
1. 적절한 시스템 모듈에 기능 구현
2. 필요시 constants.js에 상수 추가
3. JSDoc 주석으로 문서화

### 코드 스타일
- ES6+ 문법 사용
- 모듈별 단일 책임 원칙
- JSDoc으로 함수/클래스 문서화

## 라이선스

이 프로젝트는 교육 목적으로 제작되었습니다.

## 크레딧

- 3D 모델: [Quaternius Robot Pack](https://quaternius.com/)
- 개발: Anthropic Claude와 함께 제작