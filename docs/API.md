# API 문서

## Core 모듈

### gameState

게임의 전역 상태를 관리하는 싱글톤 객체입니다.

#### 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `currentState` | string | 현재 게임 상태 ('playing', 'player_won', 'player_lost', 'paused') |
| `currentTurn` | string | 현재 턴 ('player' 또는 'enemy') |
| `selectedCharacter` | Character\|null | 현재 선택된 캐릭터 |
| `isAttackMode` | boolean | 공격 모드 활성화 여부 |
| `turnCount` | number | 현재 턴 수 |
| `playerCharacters` | Character[] | 플레이어 캐릭터 목록 |
| `enemyCharacters` | Character[] | 적 캐릭터 목록 |

#### 메서드

##### selectCharacter(character)
캐릭터를 선택합니다.
```javascript
gameState.selectCharacter(playerCharacter);
```

##### clearSelection()
현재 선택을 해제합니다.
```javascript
gameState.clearSelection();
```

##### endTurn()
현재 턴을 종료하고 다음 턴으로 전환합니다.
```javascript
const nextTurn = gameState.endTurn();
// Returns: 'player' 또는 'enemy'
```

##### isPlaying()
게임이 진행 중인지 확인합니다.
```javascript
if (gameState.isPlaying()) {
    // 게임 로직 실행
}
```

### sceneSetup

Three.js 씬 설정을 관리합니다.

#### 메서드

##### init(container)
씬, 카메라, 렌더러를 초기화합니다.
```javascript
const { scene, camera, renderer } = sceneSetup.init(document.body);
```

##### render()
씬을 렌더링합니다.
```javascript
sceneSetup.render();
```

## Entity 모듈

### HexTile

육각형 타일을 나타내는 클래스입니다.

#### 생성자
```javascript
const tile = new HexTile(q, r);
```

#### 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `q` | number | 큐브 좌표 q |
| `r` | number | 큐브 좌표 r |
| `s` | number | 큐브 좌표 s (자동 계산) |
| `occupant` | Character\|null | 타일 위의 캐릭터 |
| `mesh` | THREE.Mesh | 타일의 3D 메시 |

#### 메서드

##### getPixelPosition()
타일의 픽셀 좌표를 반환합니다.
```javascript
const { x, z } = tile.getPixelPosition();
```

##### setHighlight(highlight, color)
타일을 하이라이트합니다.
```javascript
tile.setHighlight(true, 0xff0000); // 빨간색 하이라이트
```

##### isOccupied()
타일이 점유되었는지 확인합니다.
```javascript
if (!tile.isOccupied()) {
    // 타일이 비어있음
}
```

##### distanceTo(otherTile)
다른 타일까지의 거리를 계산합니다.
```javascript
const distance = tile.distanceTo(targetTile);
```

### Character

게임 캐릭터를 나타내는 클래스입니다.

#### 생성자
```javascript
const character = new Character(type, tile, name);
// type: 'player' 또는 'enemy'
```

#### 속성

| 속성 | 타입 | 설명 |
|------|------|------|
| `id` | number | 캐릭터 고유 ID |
| `type` | string | 캐릭터 타입 |
| `name` | string | 캐릭터 이름 |
| `health` | number | 현재 체력 |
| `maxHealth` | number | 최대 체력 |
| `attackPower` | number | 공격력 |
| `currentTile` | HexTile | 현재 위치한 타일 |
| `hasMoved` | boolean | 이번 턴 이동 여부 |
| `hasAttacked` | boolean | 이번 턴 공격 여부 |

#### 메서드

##### moveTo(targetTile, callback)
타일로 이동합니다.
```javascript
character.moveTo(targetTile, () => {
    console.log('이동 완료');
});
```

##### attack(target, callback)
대상을 공격합니다.
```javascript
const damage = character.attack(enemy, () => {
    console.log(`${damage} 데미지!`);
});
```

##### takeDamage(damage)
데미지를 받습니다.
```javascript
character.takeDamage(20);
```

##### isAlive()
생존 여부를 확인합니다.
```javascript
if (character.isAlive()) {
    // 캐릭터가 살아있음
}
```

## System 모듈

### gridSystem

육각형 그리드를 관리합니다.

#### 메서드

##### createGrid()
그리드를 생성합니다.
```javascript
gridSystem.createGrid();
```

##### getTile(q, r)
특정 좌표의 타일을 가져옵니다.
```javascript
const tile = gridSystem.getTile(0, 0);
```

##### getNeighbors(tile)
타일의 이웃들을 가져옵니다.
```javascript
const neighbors = gridSystem.getNeighbors(tile);
// Returns: HexTile[]
```

##### findPath(start, end, ignoreOccupants)
두 타일 사이의 경로를 찾습니다.
```javascript
const path = gridSystem.findPath(startTile, endTile);
// Returns: HexTile[] (경로)
```

##### getMovableTiles(character)
캐릭터가 이동 가능한 타일들을 반환합니다.
```javascript
const movableTiles = gridSystem.getMovableTiles(character);
```

### combatSystem

전투 로직을 처리합니다.

#### 콜백 속성

```javascript
combatSystem.onCombatLog = (message) => {
    console.log(message);
};

combatSystem.onCharacterDeath = (character) => {
    console.log(`${character.name} 사망`);
};

combatSystem.onCombatEnd = (result) => {
    console.log(`게임 종료: ${result}`);
};
```

#### 메서드

##### performAttack(attacker, target, callback)
공격을 실행합니다.
```javascript
combatSystem.performAttack(player, enemy, () => {
    console.log('공격 완료');
});
```

##### canAttack(attacker, target)
공격 가능 여부를 확인합니다.
```javascript
if (combatSystem.canAttack(player, enemy)) {
    // 공격 가능
}
```

### movementSystem

이동 시스템을 관리합니다.

#### 메서드

##### moveCharacter(character, targetTile, callback)
캐릭터를 이동시킵니다.
```javascript
movementSystem.moveCharacter(character, tile, () => {
    console.log('이동 완료');
});
```

##### showMovableTiles(character)
이동 가능한 타일을 표시합니다.
```javascript
movementSystem.showMovableTiles(selectedCharacter);
```

##### clearAllHighlights()
모든 하이라이트를 제거합니다.
```javascript
movementSystem.clearAllHighlights();
```

### aiSystem

AI 시스템을 관리합니다.

#### 메서드

##### executeEnemyTurn(callback)
적 턴을 실행합니다.
```javascript
aiSystem.executeEnemyTurn(() => {
    console.log('적 턴 종료');
});
```

##### setDifficulty(level)
AI 난이도를 설정합니다 (0-10).
```javascript
aiSystem.setDifficulty(7); // 높은 난이도
```

## Control 모듈

### cameraControls

카메라 조작을 관리합니다.

#### 메서드

##### init()
카메라 컨트롤을 초기화합니다.
```javascript
cameraControls.init();
```

##### moveTo(position, duration)
특정 위치로 카메라를 이동합니다.
```javascript
const targetPos = new THREE.Vector3(10, 0, 10);
cameraControls.moveTo(targetPos, 1000); // 1초 동안 이동
```

##### focusOnCharacter(character, duration)
캐릭터에 포커스합니다.
```javascript
cameraControls.focusOnCharacter(selectedCharacter, 500);
```

### inputHandler

사용자 입력을 처리합니다.

#### 메서드

##### init()
입력 핸들러를 초기화합니다.
```javascript
inputHandler.init();
```

##### setEnabled(enabled)
입력 활성화/비활성화합니다.
```javascript
inputHandler.setEnabled(false); // 입력 비활성화
```

## UI 모듈

### combatLog

전투 로그를 관리합니다.

#### 메서드

##### addLog(message, type)
로그를 추가합니다.
```javascript
combatLog.addLog('전투 시작!', 'system');
// type: 'damage', 'heal', 'move', 'turn', 'system', 'victory', 'defeat'
```

##### addDamageLog(attacker, target, damage, isCritical)
데미지 로그를 추가합니다.
```javascript
combatLog.addDamageLog('플레이어', '고블린', 25, true);
```

### fpsCounter

FPS 카운터를 관리합니다.

#### 메서드

##### update(currentTime)
FPS를 업데이트합니다.
```javascript
// 게임 루프에서 호출
fpsCounter.update(performance.now());
```

##### getPerformanceInfo()
성능 정보를 가져옵니다.
```javascript
const perfInfo = fpsCounter.getPerformanceInfo();
console.log(`현재 FPS: ${perfInfo.currentFPS}`);
```

## Utility 모듈

### hexMath

육각형 관련 수학 함수들을 제공합니다.

#### 함수

##### hexDistance(hexA, hexB)
두 육각형 사이의 거리를 계산합니다.
```javascript
const distance = hexDistance(
    { q: 0, r: 0, s: 0 },
    { q: 2, r: -1, s: -1 }
);
```

##### hexNeighbor(hex, direction)
특정 방향의 이웃을 가져옵니다.
```javascript
const neighbor = hexNeighbor({ q: 0, r: 0, s: 0 }, 0); // 오른쪽
```

##### cubeToPixel(q, r, size)
큐브 좌표를 픽셀 좌표로 변환합니다.
```javascript
const { x, y } = cubeToPixel(1, 0, HEX_SIZE);
```

### animation

애니메이션 유틸리티를 제공합니다.

#### 클래스

##### Tween
```javascript
const tween = new Tween(
    object,           // 대상 객체
    { x: 100 },      // 목표 속성
    1000,            // 지속 시간 (ms)
    Easing.quadOut   // 이징 함수
);

tween
    .onUpdateCallback((obj, progress) => {
        console.log(`진행도: ${progress}`);
    })
    .onCompleteCallback(() => {
        console.log('애니메이션 완료');
    })
    .start();
```

#### 함수

##### shakeCamera(camera, intensity, duration)
카메라 흔들기 효과를 적용합니다.
```javascript
shakeCamera(sceneSetup.camera, 0.5, 500);
```