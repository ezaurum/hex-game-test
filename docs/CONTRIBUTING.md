# 기여 가이드라인

이 프로젝트에 기여해주셔서 감사합니다! 다음 가이드라인을 따라주시면 원활한 협업이 가능합니다.

## 🤝 기여 방법

### 1. 이슈 생성
버그를 발견하거나 새로운 기능을 제안하고 싶다면:
1. 기존 이슈를 먼저 확인해주세요
2. 중복되지 않는다면 새 이슈를 생성해주세요
3. 이슈 템플릿을 사용해주세요

### 2. 포크 및 브랜치 생성
```bash
# 저장소 포크 후
git clone https://github.com/your-username/hex-tile-rpg.git
cd hex-tile-rpg

# 새 브랜치 생성
git checkout -b feature/your-feature-name
# 또는
git checkout -b fix/bug-description
```

### 3. 개발
코드를 작성할 때 다음 사항을 준수해주세요:
- 기존 코드 스타일 따르기
- 주석 작성 (한국어 가능)
- 테스트 코드 작성 (가능한 경우)

### 4. 커밋
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
# 또는
git commit -m "fix: 버그 수정"
```

### 5. 풀 리퀘스트
- 명확한 제목과 설명 작성
- 관련 이슈 번호 참조
- 스크린샷 첨부 (UI 변경사항이 있는 경우)

## 📝 코딩 규칙

### JavaScript 스타일 가이드

#### 명명 규칙
```javascript
// 클래스명: PascalCase
class CharacterController { }

// 함수/메서드명: camelCase
function calculateDamage() { }

// 상수: UPPER_SNAKE_CASE
const MAX_HEALTH = 100;

// 변수: camelCase
let currentHealth = 50;
```

#### 들여쓰기
- 스페이스 4칸 사용
- 탭 사용 금지

#### 주석
```javascript
/**
 * 캐릭터를 이동시킵니다.
 * 
 * @param {Character} character - 이동할 캐릭터
 * @param {HexTile} targetTile - 목표 타일
 * @returns {boolean} 이동 성공 여부
 */
function moveCharacter(character, targetTile) {
    // 이동 가능 여부 확인
    if (!canMoveTo(character, targetTile)) {
        return false;
    }
    
    // TODO: 애니메이션 추가
    character.position = targetTile.position;
    return true;
}
```

### 모듈 구조
```javascript
// 1. Import 문
import { CONSTANTS } from './constants.js';
import { Character } from '../entities/Character.js';

// 2. 클래스/함수 정의
export class MyModule {
    // ...
}

// 3. Export 문 (필요한 경우)
export { myFunction, myVariable };
```

### Three.js 관련
```javascript
// 리소스 정리 필수
dispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
    if (this.texture) this.texture.dispose();
}

// 메모리 누수 방지
scene.remove(mesh);
mesh.geometry.dispose();
mesh.material.dispose();
```

## 🧪 테스트

### 수동 테스트 체크리스트
- [ ] 모든 캐릭터가 정상적으로 생성되는가?
- [ ] 이동이 올바르게 작동하는가?
- [ ] 공격이 정상적으로 처리되는가?
- [ ] AI가 적절히 행동하는가?
- [ ] UI가 정보를 올바르게 표시하는가?
- [ ] 게임 종료 조건이 작동하는가?
- [ ] 메모리 누수가 없는가?

### 성능 테스트
```javascript
// FPS 확인
console.log(fpsCounter.getPerformanceInfo());

// 메모리 사용량 확인 (Chrome DevTools)
performance.memory.usedJSHeapSize / 1048576 // MB
```

## 🏗️ 프로젝트 구조 유지

### 새 모듈 추가 시
1. 적절한 디렉토리에 파일 생성
2. 모듈 템플릿 사용:

```javascript
/**
 * 모듈 설명
 * 
 * 상세한 설명...
 * 
 * @module moduleName
 */

import { dependency } from './dependency.js';

/**
 * 클래스 설명
 * 
 * @class ClassName
 */
export class ClassName {
    constructor() {
        // 초기화
    }
    
    /**
     * 메서드 설명
     * 
     * @param {Type} param - 파라미터 설명
     * @returns {Type} 반환값 설명
     */
    method(param) {
        // 구현
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        // 정리 코드
    }
}
```

### 기존 모듈 수정 시
1. 기존 인터페이스 유지 (가능한 경우)
2. Breaking change가 있다면 명확히 문서화
3. 관련된 모든 파일 업데이트

## 📋 커밋 메시지 규칙

### 형식
```
<타입>: <제목>

<본문> (선택사항)

<꼬리말> (선택사항)
```

### 타입
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅, 세미콜론 누락 등
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드 작업, 패키지 관리 등

### 예시
```
feat: 원거리 공격 기능 추가

- Archer 클래스 구현
- 시야선 체크 로직 추가
- 투사체 애니메이션 구현

Closes #123
```

## 🚀 릴리스 프로세스

1. 버전 번호 업데이트 (Semantic Versioning)
2. CHANGELOG.md 업데이트
3. 태그 생성
```bash
git tag -a v1.2.0 -m "Version 1.2.0"
git push origin v1.2.0
```

## 💬 커뮤니케이션

### 질문이 있을 때
1. 먼저 문서를 확인해주세요
2. 이슈나 PR에 댓글로 질문해주세요
3. 한국어/영어 모두 가능합니다

### 코드 리뷰
- 건설적인 피드백 제공
- 구체적인 개선 방안 제시
- 긍정적인 부분도 언급

## ⚖️ 라이선스

이 프로젝트에 기여하시면 MIT 라이선스에 동의하는 것으로 간주됩니다.

## 🙏 감사합니다!

여러분의 기여가 이 프로젝트를 더 좋게 만듭니다. 작은 기여라도 환영합니다!

### 기여자 목록
<!-- 기여자 목록은 자동으로 업데이트됩니다 -->

---

질문이나 제안사항이 있다면 언제든 이슈를 생성해주세요!