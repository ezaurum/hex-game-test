/**
 * 캐릭터 클래스
 *
 * 플레이어와 적 캐릭터를 나타내는 클래스입니다.
 * 체력, 공격력, 이동 등의 기능을 포함합니다.
 *
 * @module Character
 */

import * as THREE from 'three';
import {
    COLORS,
    CHARACTER_TYPE,
    PLAYER_MAX_HEALTH,
    ENEMY_MAX_HEALTH,
    MOVEMENT_RANGE,
    ATTACK_RANGE,
    BASE_ATTACK_DAMAGE,
    DAMAGE_VARIANCE,
    ANIMATION
} from '../core/constants.js';
import { healthBarUI } from '../ui/healthBarUI.js';
import { resourceManager } from '../managers/resourceManager.js';

/**
 * 캐릭터 클래스
 *
 * @class Character
 */
export class Character {
    /**
     * 캐릭터 ID 생성용 카운터
     * @static
     * @type {number}
     */
    static idCounter = 0;

    /**
     * @param {string} type - 캐릭터 타입 ('player' 또는 'enemy')
     * @param {HexTile} tile - 초기 위치 타일
     * @param {string} [name] - 캐릭터 이름 (선택적)
     */
    constructor(type, tile, name) {
        /**
         * 캐릭터 고유 ID
         * @type {number}
         */
        this.id = ++Character.idCounter;

        /**
         * 캐릭터 타입
         * @type {string}
         */
        this.type = type;

        /**
         * 캐릭터 이름
         * @type {string}
         */
        this.name = name || (type === CHARACTER_TYPE.PLAYER ? `플레이어 ${this.id}` : `적 ${this.id}`);

        /**
         * 현재 위치한 타일
         * @type {HexTile}
         */
        this.currentTile = tile;

        /**
         * 최대 체력
         * @type {number}
         */
        this.maxHealth = type === CHARACTER_TYPE.PLAYER ? PLAYER_MAX_HEALTH : ENEMY_MAX_HEALTH;

        /**
         * 현재 체력
         * @type {number}
         */
        this.health = this.maxHealth;

        /**
         * 공격력
         * @type {number}
         */
        this.attackPower = BASE_ATTACK_DAMAGE;

        /**
         * 이동 범위
         * @type {number}
         */
        this.movementRange = MOVEMENT_RANGE;

        /**
         * 공격 범위
         * @type {number}
         */
        this.attackRange = ATTACK_RANGE;

        /**
         * 이번 턴에 이동했는지 여부
         * @type {boolean}
         */
        this.hasMoved = false;
        
        /**
         * 이번 턴에 이동한 거리
         * @type {number}
         */
        this.movedDistance = 0;

        /**
         * 이번 턴에 공격했는지 여부
         * @type {boolean}
         */
        this.hasAttacked = false;
        
        /**
         * 현재 공격에서 데미지를 입혔는지 여부 (중복 방지)
         * @type {boolean}
         */
        this.hasDealtDamage = false;
        
        /**
         * 턴당 행동 가능 횟수 (기본: 이동 1회, 공격 1회)
         * @type {Object}
         */
        this.actionsPerTurn = {
            move: 1,
            attack: 1
        };
        
        /**
         * 이번 턴에 사용한 행동 횟수
         * @type {Object}
         */
        this.actionsUsed = {
            move: 0,
            attack: 0
        };

        /**
         * 선택 상태
         * @type {boolean}
         */
        this.isSelected = false;
        
        /**
         * 현재 바라보는 방향 (라디안)
         * @type {number}
         */
        this.facingDirection = 0;

        /**
         * Three.js 그룹 (캐릭터 + UI)
         * @type {THREE.Group}
         */
        this.group = new THREE.Group();

        /**
         * 캐릭터 메시
         * @type {THREE.Mesh}
         */
        this.mesh = null;

        // 3D 모델 생성
        this.createMesh();
        
        // 2D 체력바 생성
        healthBarUI.createHealthBar(this);

        // 초기 위치 설정
        if (tile) {
            tile.setOccupant(this);
        }
    }

    /**
     * 캐릭터 3D 메시 생성
     *
     * 간단한 캡슐 형태로 캐릭터를 표현합니다.
     */
    createMesh() {
        // 캐릭터 색상 결정
        const color = this.type === CHARACTER_TYPE.PLAYER
            ? COLORS.CHARACTER_PLAYER
            : COLORS.CHARACTER_ENEMY;

        // 임시 placeholder 메시 생성 (모델 로드 전까지 표시)
        // 몸통
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666, // 중성 회색
            flatShading: true
        });
        const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        bodyMesh.position.y = 0.3;
        
        // 머리
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: color, // 팀 색상
            flatShading: true
        });
        const headMesh = new THREE.Mesh(headGeometry, headMaterial);
        headMesh.position.y = 0.7;
        headMesh.name = 'head'; // 머리 식별용
        
        const placeholderGroup = new THREE.Group();
        placeholderGroup.add(bodyMesh);
        placeholderGroup.add(headMesh);

        // 그룹에 추가
        this.mesh = new THREE.Group();
        this.mesh.add(placeholderGroup);

        // 리소스 매니저에서 모델 가져오기
        const robotGltf = resourceManager.getModel('robot');
        if (robotGltf) {
            // 기존 placeholder 제거
            this.mesh.clear();

            // 모델 복제 (여러 캐릭터가 같은 모델 사용)
            this.model = robotGltf.scene.clone();
            this.model.scale.set(0.25, 0.25, 0.25); // 크기 조정
            this.model.position.y = 0.05; // 타일 위에 위치
            this.model.rotation.y = this.facingDirection; // 저장된 방향 적용

            // 모델의 모든 메시에 색상 적용
            this.model.traverse((child) => {
                if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // 캐릭터 타입에 따른 색상 적용
                        child.material = child.material.clone();
                        child.material.color.setHex(color);
                        if (this.type === CHARACTER_TYPE.ENEMY) {
                            child.material.emissive = new THREE.Color(0xff0000);
                            child.material.emissiveIntensity = 0.1;
                        }

                        // 캐릭터 데이터 저장 (레이캐스팅용)
                        child.userData.character = this;
                    }
                });

            // 애니메이션 설정
            if (robotGltf.animations && robotGltf.animations.length > 0) {
                this.mixer = new THREE.AnimationMixer(this.model);
                this.animations = {};

                // 모든 애니메이션 저장
                robotGltf.animations.forEach((clip) => {
                    this.animations[clip.name] = clip;
                });

                // 기본 애니메이션 재생 (Idle)
                const idleClip = this.animations['Idle'] || robotGltf.animations[0];
                if (idleClip) {
                    const action = this.mixer.clipAction(idleClip);
                    action.play();
                    this.currentAction = action;
                }
            }

            this.mesh.add(this.model);

            // 데이터 저장
            this.mesh.userData.character = this;
            this.model.userData.character = this;
        } else {
            console.warn('Robot model not loaded yet, using placeholder');
        }

        // 캐릭터 데이터 저장 (레이캐스팅용)
        this.mesh.userData.character = this;

        // 메인 그룹에 추가
        this.group.add(this.mesh);
        
        // 그룹 자체에도 캐릭터 데이터 저장
        this.group.userData.character = this;
    }

    /**
     * 캐릭터 위치 설정
     *
     * @param {number} x - X 좌표
     * @param {number} z - Z 좌표
     */
    setPosition(x, z) {
        this.group.position.x = x;
        this.group.position.z = z;
    }
    
    /**
     * 행동 상태에 따른 시각적 표현 업데이트
     */
    updateActionVisual() {
        if (!this.mesh) return;
        
        // 모든 행동을 완료했는지 확인
        const hasUsedAllMoves = this.actionsUsed.move >= this.actionsPerTurn.move || 
                               this.movedDistance >= this.movementRange;
        const hasUsedAllAttacks = this.actionsUsed.attack >= this.actionsPerTurn.attack;
        const allActionsComplete = hasUsedAllMoves && hasUsedAllAttacks;
        
        // mesh 전체를 순회하며 material 업데이트
        this.mesh.traverse(child => {
            if (child.isMesh && child.material) {
                // 머리 부분인지 확인
                const isHead = child.name.toLowerCase().includes('head') || 
                              child.name.toLowerCase().includes('face') ||
                              child.position.y > 1.5;
                
                if (allActionsComplete) {
                    // 모든 행동 완료 - 어두운 회색조로 표현
                    child.material.color = new THREE.Color(0x333333);
                    child.material.emissive = new THREE.Color(0x000000);
                    child.material.emissiveIntensity = 0;
                } else {
                    // 행동 가능 - 원래 색상
                    if (isHead) {
                        // 머리만 팀 색상
                        const baseColor = this.type === CHARACTER_TYPE.PLAYER ? COLORS.CHARACTER_PLAYER : COLORS.CHARACTER_ENEMY;
                        child.material.color = new THREE.Color(baseColor);
                    } else {
                        // 몸통은 중성 회색
                        child.material.color = new THREE.Color(0x666666);
                    }
                    
                    // 부분적 행동 가능 상태 표시 - 발광으로만
                    if (!hasUsedAllMoves && hasUsedAllAttacks) {
                        // 이동만 가능 - 파란색 발광
                        child.material.emissive = new THREE.Color(0x0066ff);
                        child.material.emissiveIntensity = 0.2;
                    } else if (hasUsedAllMoves && !hasUsedAllAttacks) {
                        // 공격만 가능 - 빨간색 발광
                        child.material.emissive = new THREE.Color(0xff0000);
                        child.material.emissiveIntensity = 0.2;
                    } else if (!this.isSelected) {
                        child.material.emissive = new THREE.Color(0x000000);
                        child.material.emissiveIntensity = 0;
                    }
                }
            }
        });
    }

    /**
     * 다른 타일로 이동 (로직만 처리)
     *
     * @param {HexTile} targetTile - 목표 타일
     * @param {Function} [onComplete] - 이동 완료 콜백
     * @param {number} [distance=1] - 이동 거리
     */
    moveTo(targetTile, onComplete, distance = 1) {
        // 이 메서드는 더 이상 사용되지 않음
        // battleManager.moveCharacter를 사용하세요
        console.warn('Character.moveTo is deprecated. Use battleManager.moveCharacter instead.');
        if (onComplete) onComplete();
    }

    /**
     * 다른 캐릭터 공격 (로직만 처리)
     *
     * @param {Character} target - 공격 대상
     * @param {Function} [onComplete] - 공격 완료 콜백
     * @returns {number} 실제 데미지
     */
    attack(target, onComplete) {
        // 이 메서드는 더 이상 사용되지 않음
        // battleManager.performAttack을 사용하세요
        console.warn('Character.attack is deprecated. Use battleManager.performAttack instead.');
        if (onComplete) onComplete();
        return 0;
    }

    /**
     * 데미지 받기 (전투 매니저에서 호출됨)
     *
     * @param {number} damage - 받을 데미지
     * @param {Character} [attacker] - 공격자 (선택적)
     */
    takeDamage(damage, attacker) {
        // 전투 매니저가 처리하므로 여기서는 기본적인 처리만
        this.health = Math.max(0, this.health - damage);
        this.updateHealthBar();
    }
    
    /**
     * 체력바 업데이트
     */
    updateHealthBar() {
        healthBarUI.updateHealthBar(this);
    }

    /**
     * 캐릭터 사망 처리
     */
    die() {

        // 타일에서 제거
        if (this.currentTile) {
            this.currentTile.removeOccupant();
        }

        // 사망 애니메이션 (페이드 아웃)
        const startTime = Date.now();
        const duration = 1000;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 투명도 감소
            this.group.traverse((child) => {
                if (child.material) {
                    child.material.opacity = 1 - progress;
                    child.material.transparent = true;
                }
            });

            // 아래로 가라앉기
            this.group.position.y = -progress * 0.5;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * 선택 상태 설정
     *
     * @param {boolean} selected - 선택 여부
     */
    setSelected(selected) {
        this.isSelected = selected;

        // mesh 전체를 순회하며 material이 있는 객체만 처리
        this.mesh.traverse(child => {
            if (child.isMesh && child.material) {
                if (selected) {
                    // 선택 강조 효과
                    child.material.emissive = new THREE.Color(COLORS.CHARACTER_SELECTED);
                    child.material.emissiveIntensity = 0.3;
                } else {
                    // 강조 제거 - 행동 상태에 따라 업데이트
                    this.updateActionVisual();
                    return;
                }
            }
        });
    }

    /**
     * 턴 초기화
     */
    resetTurn() {
        this.hasMoved = false;
        this.movedDistance = 0;
        this.hasAttacked = false;
        
        // 행동 횟수 초기화
        this.actionsUsed.move = 0;
        this.actionsUsed.attack = 0;
    }

    /**
     * 행동 가능 여부 확인
     *
     * @returns {boolean}
     */
    canAct() {
        return (this.movedDistance < this.movementRange) || !this.hasAttacked;
    }

    /**
     * 생존 여부 확인
     *
     * @returns {boolean}
     */
    isAlive() {
        return this.health > 0 && !this.isDead;
    }

    /**
     * 캐릭터 정보 문자열
     *
     * @returns {string}
     */
    toString() {
        return `${this.name} (HP: ${this.health}/${this.maxHealth})`;
    }

    /**
     * 애니메이션 업데이트
     * @param {number} delta - 프레임 간 시간 차이
     */
    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }

    /**
     * 애니메이션 재생
     * @param {string} animationName - 재생할 애니메이션 이름
     * @param {boolean} loop - 반복 여부
     */
    playAnimation(animationName, loop = true) {
        if (!this.animations || !this.animations[animationName]) {
            return;
        }

        const clip = this.animations[animationName];
        const action = this.mixer.clipAction(clip);

        // 현재 애니메이션 페이드 아웃
        if (this.currentAction && this.currentAction !== action) {
            this.currentAction.fadeOut(0.5);
        }

        // 새 애니메이션 페이드 인
        action.reset();
        action.fadeIn(0.5);
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce);
        action.play();

        this.currentAction = action;
    }


    /**
     * 리소스 정리
     */
    dispose() {
        // 애니메이션 정리
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer = null;
        }

        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        
        // 2D 체력바 제거
        healthBarUI.removeHealthBar(this);
    }
}
