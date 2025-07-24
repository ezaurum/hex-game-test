# Claude 개발 가이드

이 문서는 Claude가 이 프로젝트를 이해하고 효율적으로 작업할 수 있도록 돕는 개발 가이드입니다.

## 프로젝트 개요

헥스 타일 기반 턴제 전술 RPG 프로토타입으로, 모듈러 아키텍처와 Three.js를 사용합니다.

## 주요 아키텍처 결정사항

### 1. 모듈 시스템
- **싱글톤 패턴**: 주요 시스템들은 싱글톤으로 구현 (gameState, gridSystem, movementSystem 등)
- **ES6 모듈**: import/export로 의존성 관리
- **단일 책임**: 각 모듈은 하나의 명확한 책임만 가짐

### 2. 좌표 시스템
- **Cube 좌표계**: 헥스 타일은 q, r, s 좌표 사용 (s = -q - r)
- **픽셀 좌표**: Three.js 월드 좌표로 변환하여 렌더링

### 3. 캐릭터 시스템
- **이동**: 턴당 3칸, 남은 이동력 추적 (movedDistance)
- **공격**: 사거리 1칸, 애니메이션과 동기화
- **방향**: facingDirection으로 바라보는 방향 유지

### 4. 애니메이션
- **GLTF 모델**: RobotExpressive 모델 사용
- **애니메이션**: Idle, Walk, Punch, Hit
- **타이밍**: 공격 애니메이션 40% 지점에서 데미지 적용

## 중요한 구현 세부사항

### 캐릭터 이동
```javascript
// Character.js의 moveTo 메서드
// setOccupant(this, false)로 즉시 위치 업데이트 방지
// 애니메이션 중 방향 계산을 위해 필요
targetTile.setOccupant(this, false);
```

### 레이캐스팅
```javascript
// inputHandler.js의 performRaycast
// 캐릭터 그룹과 타일을 별도로 수집하여 정확한 클릭 감지
sceneSetup.scene.traverse((object) => {
    if (object.userData && object.userData.character) {
        // 그룹 내 모든 메시 추가
    }
});
```

### 턴 시스템
- 플레이어가 모든 행동을 마치면 자동으로 적 턴 시작
- 캐릭터별 hasMoved, hasAttacked 플래그로 행동 추적

## 일반적인 작업 패턴

### 새 기능 추가
1. constants.js에 필요한 상수 정의
2. 적절한 시스템 모듈에 로직 구현
3. 필요시 UI 컴포넌트 추가
4. inputHandler.js에 입력 처리 추가

### 디버깅
1. 빌드/린트 명령어 실행: `npm run build`, `npm run lint`
2. 브라우저 콘솔에서 오류 확인
3. Three.js Inspector 확장 프로그램 활용

### 성능 최적화
1. 불필요한 레이캐스팅 최소화
2. 애니메이션 업데이트는 requestAnimationFrame 사용
3. 메모리 누수 방지를 위해 dispose() 메서드 구현

## 주의사항

### 하지 말아야 할 것
- game.js 파일 수정 (레거시 코드)
- console.log 남용 (필요한 경우만)
- 동기적 파일 로딩 (비동기 사용)

### 해야 할 것
- JSDoc 주석으로 문서화
- 에러 처리 추가
- 기존 코드 스타일 따르기

## 테스트 및 검증

### 수동 테스트 체크리스트
- [ ] 캐릭터 선택 및 이동
- [ ] 공격 애니메이션 동기화
- [ ] 턴 전환
- [ ] AI 동작
- [ ] 카메라 컨트롤
- [ ] UI 업데이트

### 일반적인 버그
1. **클릭이 안 됨**: 레이캐스팅 대상 확인
2. **애니메이션 안 됨**: 모델 로드 상태 확인
3. **이동 안 됨**: hasMoved, movedDistance 상태 확인

## 확장 가능한 영역

1. **스킬 시스템**: combatSystem에 스킬 클래스 추가
2. **맵 에디터**: gridSystem 확장
3. **멀티플레이**: gameState를 서버 동기화
4. **세이브/로드**: gameState 직렬화

## 유용한 리소스

- [Three.js 문서](https://threejs.org/docs/)
- [Red Blob Games - Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/)
- [GLTF 모델 뷰어](https://gltf-viewer.donmccurdy.com/)