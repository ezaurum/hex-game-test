# 게임 개발 튜토리얼

이 튜토리얼에서는 육각형 타일 기반 RPG 게임의 주요 기능들을 단계별로 구현하는 방법을 설명합니다.

## 📚 목차

1. [육각형 그리드 구현](#1-육각형-그리드-구현)
2. [Three.js 기초 설정](#2-threejs-기초-설정)
3. [캐릭터 이동 시스템](#3-캐릭터-이동-시스템)
4. [전투 시스템 구현](#4-전투-시스템-구현)
5. [AI 구현 가이드](#5-ai-구현-가이드)

## 1. 육각형 그리드 구현

### 육각형 좌표계 이해하기

육각형 그리드에서는 큐브 좌표계(Cube Coordinates)를 사용합니다.

```javascript
// 큐브 좌표계의 기본 원리
// q + r + s = 0 (항상 성립해야 함)

class HexTile {
    constructor(q, r) {
        this.q = q;
        this.r = r;
        this.s = -q - r;  // 자동 계산
    }
}
```

### 육각형 타일 생성하기

```javascript
// Three.js를 사용한 육각형 메시 생성
createMesh() {
    // 육각형은 6면체 실린더로 표현
    const geometry = new THREE.CylinderGeometry(
        HEX_SIZE,    // 상단 반지름
        HEX_SIZE,    // 하단 반지름
        0.1,         // 높이
        6,           // 면의 수 (육각형)
        1            // 높이 세그먼트
    );
    
    const material = new THREE.MeshPhongMaterial({
        color: 0x4a4a4a,
        flatShading: true
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    
    // 육각형이 평평하게 놓이도록 회전
    this.mesh.rotation.y = Math.PI / 6;
}
```

### 좌표 변환

```javascript
// 큐브 좌표를 픽셀 좌표로 변환 (Flat-top 레이아웃)
getPixelPosition() {
    const x = HEX_SIZE * (3/2 * this.q);
    const z = HEX_SIZE * (Math.sqrt(3)/2 * this.q + Math.sqrt(3) * this.r);
    return { x, z };
}
```

**참고 자료**: [Red Blob Games - Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/)

## 2. Three.js 기초 설정

### 씬, 카메라, 렌더러 설정

```javascript
// 씬 생성
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x000000, 10, 50);  // 안개 효과

// 카메라 생성
const camera = new THREE.PerspectiveCamera(
    75,                                    // FOV
    window.innerWidth / window.innerHeight, // 종횡비
    0.1,                                   // Near
    1000                                   // Far
);
camera.position.set(10, 10, 10);

// 렌더러 생성
const renderer = new THREE.WebGLRenderer({ 
    antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
```

### 조명 추가

```javascript
// 환경광 (전체적으로 은은한 빛)
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// 방향광 (태양광 효과)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(10, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);
```

### 애니메이션 루프

```javascript
function animate() {
    requestAnimationFrame(animate);
    
    // 애니메이션 업데이트
    updateAnimations();
    
    // 렌더링
    renderer.render(scene, camera);
}

animate();
```

**참고 자료**: [Three.js 공식 문서](https://threejs.org/docs/)

## 3. 캐릭터 이동 시스템

### A* 경로 찾기 알고리즘

```javascript
findPath(start, end) {
    const openSet = [start];
    const closedSet = new Set();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    
    gScore.set(start, 0);
    fScore.set(start, start.distanceTo(end));
    
    while (openSet.length > 0) {
        // f값이 가장 낮은 노드 선택
        let current = openSet.reduce((a, b) => 
            fScore.get(a) < fScore.get(b) ? a : b
        );
        
        if (current === end) {
            // 경로 재구성
            const path = [];
            while (cameFrom.has(current)) {
                path.unshift(current);
                current = cameFrom.get(current);
            }
            return path;
        }
        
        // 현재 노드 처리
        openSet.splice(openSet.indexOf(current), 1);
        closedSet.add(current);
        
        // 이웃 탐색
        for (const neighbor of this.getNeighbors(current)) {
            if (closedSet.has(neighbor)) continue;
            
            const tentativeGScore = gScore.get(current) + 1;
            
            if (!openSet.includes(neighbor)) {
                openSet.push(neighbor);
            } else if (tentativeGScore >= gScore.get(neighbor)) {
                continue;
            }
            
            cameFrom.set(neighbor, current);
            gScore.set(neighbor, tentativeGScore);
            fScore.set(neighbor, tentativeGScore + neighbor.distanceTo(end));
        }
    }
    
    return []; // 경로 없음
}
```

### 이동 가능 영역 표시

```javascript
showMovableTiles(character) {
    const movableTiles = [];
    const tilesInRange = this.getTilesInRange(character.currentTile, character.movementRange);
    
    for (const tile of tilesInRange) {
        if (!tile.isOccupied()) {
            const path = this.findPath(character.currentTile, tile);
            if (path.length > 0 && path.length <= character.movementRange) {
                tile.setMovable(true);
                movableTiles.push(tile);
            }
        }
    }
    
    return movableTiles;
}
```

### 부드러운 이동 애니메이션

```javascript
moveTo(targetTile, callback) {
    const startPos = { ...this.group.position };
    const targetPos = targetTile.getPixelPosition();
    const duration = 500;
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 이징 함수 적용
        const eased = this.easeInOutCubic(progress);
        
        // 위치 보간
        this.group.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
        this.group.position.z = startPos.z + (targetPos.z - startPos.z) * eased;
        
        // 점프 효과
        this.group.position.y = Math.sin(progress * Math.PI) * 0.5;
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            if (callback) callback();
        }
    };
    
    animate();
}
```

**참고 자료**: [A* 경로찾기 알고리즘](https://www.redblobgames.com/pathfinding/a-star/introduction.html)

## 4. 전투 시스템 구현

### 데미지 계산

```javascript
calculateDamage(attacker, target) {
    // 기본 데미지
    let damage = attacker.attackPower;
    
    // 랜덤 변동 (±5)
    const variance = Math.floor(Math.random() * 11) - 5;
    damage += variance;
    
    // 치명타 확률 (10%)
    if (Math.random() < 0.1) {
        damage *= 2;
        console.log('치명타!');
    }
    
    // 최소 데미지 보장
    return Math.max(1, damage);
}
```

### 공격 애니메이션

```javascript
attack(target, callback) {
    const originalPos = { ...this.group.position };
    const direction = new THREE.Vector3(
        target.group.position.x - this.group.position.x,
        0,
        target.group.position.z - this.group.position.z
    ).normalize();
    
    // 전진 후 후퇴 애니메이션
    const tween = new Tween(this.group.position, {
        x: originalPos.x + direction.x * 0.3,
        z: originalPos.z + direction.z * 0.3
    }, 150, Easing.quadOut);
    
    tween.onCompleteCallback(() => {
        // 데미지 적용
        const damage = this.calculateDamage(this, target);
        target.takeDamage(damage);
        
        // 후퇴
        const tweenBack = new Tween(this.group.position, originalPos, 150, Easing.quadIn);
        tweenBack.onCompleteCallback(callback);
        tweenBack.start();
    });
    
    tween.start();
}
```

### 체력바 UI

```javascript
createHealthBar() {
    const healthBarGroup = new THREE.Group();
    
    // 배경
    const bgGeometry = new THREE.PlaneGeometry(1, 0.1);
    const bgMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333 
    });
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
    
    // 체력 게이지
    const fillGeometry = new THREE.PlaneGeometry(1, 0.1);
    const fillMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00 
    });
    this.healthBarFill = new THREE.Mesh(fillGeometry, fillMaterial);
    
    healthBarGroup.add(bgMesh);
    healthBarGroup.add(this.healthBarFill);
    
    // 캐릭터 위에 위치
    healthBarGroup.position.y = 1.5;
    
    this.group.add(healthBarGroup);
}

updateHealthBar() {
    const healthPercent = this.health / this.maxHealth;
    this.healthBarFill.scale.x = Math.max(0, healthPercent);
    
    // 체력에 따른 색상 변경
    if (healthPercent > 0.6) {
        this.healthBarFill.material.color.setHex(0x00ff00); // 녹색
    } else if (healthPercent > 0.3) {
        this.healthBarFill.material.color.setHex(0xffff00); // 노란색
    } else {
        this.healthBarFill.material.color.setHex(0xff0000); // 빨간색
    }
}
```

## 5. AI 구현 가이드

### 기본 AI 행동 결정

```javascript
determineAction(enemy) {
    // 1. 즉시 공격 가능한지 확인
    const attackableTargets = this.findAttackableTargets(enemy);
    if (attackableTargets.length > 0) {
        const target = this.selectBestTarget(attackableTargets);
        return { type: 'attack', target };
    }
    
    // 2. 이동 후 공격 가능한지 확인
    const moveAndAttackOptions = this.findMoveAndAttackOptions(enemy);
    if (moveAndAttackOptions.length > 0) {
        const best = this.selectBestOption(moveAndAttackOptions);
        return { 
            type: 'move_and_attack', 
            moveTile: best.tile, 
            attackTarget: best.target 
        };
    }
    
    // 3. 가장 가까운 적에게 접근
    const nearestTarget = this.findNearestTarget(enemy);
    if (nearestTarget) {
        const moveTile = this.findBestApproachTile(enemy, nearestTarget);
        return { type: 'move', targetTile: moveTile };
    }
    
    return { type: 'wait' };
}
```

### 타겟 우선순위

```javascript
selectBestTarget(targets) {
    return targets.reduce((best, current) => {
        // 체력이 낮은 적 우선
        const bestHealthRatio = best.health / best.maxHealth;
        const currentHealthRatio = current.health / current.maxHealth;
        
        if (currentHealthRatio < bestHealthRatio - 0.2) {
            return current;
        }
        
        // 비슷한 체력이면 가까운 적 우선
        const bestDistance = enemy.currentTile.distanceTo(best.currentTile);
        const currentDistance = enemy.currentTile.distanceTo(current.currentTile);
        
        return currentDistance < bestDistance ? current : best;
    });
}
```

### 난이도 조절

```javascript
class AISystem {
    constructor() {
        this.difficultyLevel = 5; // 0-10
    }
    
    setDifficulty(level) {
        this.difficultyLevel = Math.max(0, Math.min(10, level));
        
        // 난이도에 따른 조정
        this.actionDelay = 2000 - (this.difficultyLevel * 150);
        this.mistakeChance = 0.3 - (this.difficultyLevel * 0.03);
    }
    
    makeDecision(enemy) {
        // 낮은 난이도에서는 가끔 실수
        if (Math.random() < this.mistakeChance) {
            return this.makeRandomDecision(enemy);
        }
        
        return this.makeOptimalDecision(enemy);
    }
}
```

## 🎯 실습 과제

### 과제 1: 새로운 타일 효과 추가
독 늪 타일을 추가해보세요. 이 타일 위에 있는 캐릭터는 매 턴 5의 데미지를 받습니다.

### 과제 2: 원거리 공격 구현
공격 범위가 3인 궁수 캐릭터를 추가해보세요. 시야선 체크도 구현해야 합니다.

### 과제 3: 스킬 시스템
캐릭터에 특수 스킬을 추가해보세요. 예: 범위 공격, 순간이동, 회복 등

### 과제 4: 승리 조건 다양화
단순한 섬멸전 외에 다른 승리 조건을 추가해보세요. 예: 특정 지점 점령, 생존 시간 등

## 📖 추가 학습 자료

- [Three.js Journey](https://threejs-journey.com/) - Three.js 심화 학습
- [Game Programming Patterns](https://gameprogrammingpatterns.com/) - 게임 디자인 패턴
- [MDN Web Docs](https://developer.mozilla.org/ko/) - 웹 개발 기초
- [JavaScript.info](https://javascript.info/) - 모던 JavaScript 튜토리얼

## 🤔 자주 묻는 질문

**Q: 육각형 그리드 대신 사각형 그리드를 사용하려면?**
A: HexTile 클래스와 hexMath 유틸리티를 수정하여 사각형 좌표계를 사용하도록 변경하면 됩니다.

**Q: 더 많은 캐릭터를 추가하면 성능이 떨어져요.**
A: 인스턴싱(Instancing)을 사용하거나, LOD(Level of Detail) 시스템을 구현해보세요.

**Q: 멀티플레이어로 확장하려면?**
A: WebSocket이나 WebRTC를 사용하여 실시간 통신을 구현하고, 서버에서 게임 상태를 관리해야 합니다.