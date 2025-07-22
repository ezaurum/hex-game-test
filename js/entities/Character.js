/**
 * 캐릭터 클래스
 *
 * 플레이어와 적 캐릭터를 나타내는 클래스입니다.
 * 체력, 공격력, 이동 등의 기능을 포함합니다.
 *
 * @module Character
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
         * 이번 턴에 공격했는지 여부
         * @type {boolean}
         */
        this.hasAttacked = false;

        /**
         * 선택 상태
         * @type {boolean}
         */
        this.isSelected = false;

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

        /**
         * 체력바 그룹
         * @type {THREE.Group}
         */
        this.healthBarGroup = null;

        // 3D 모델 생성
        this.createMesh();
        this.createHealthBar();

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
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 8);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: color,
            flatShading: true,
            opacity: 0.3,
            transparent: true
        });
        const placeholderMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
        placeholderMesh.position.y = 0.4;

        // 그룹에 추가
        this.mesh = new THREE.Group();
        this.mesh.add(placeholderMesh);

        // GLTF 모델 로드
        const loader = new GLTFLoader();
        loader.load('RobotExpressive/RobotExpressive.glb',
            (gltf) => {
                // 기존 placeholder 제거
                this.mesh.clear();

                // 모델 설정
                this.model = gltf.scene;
                this.model.scale.set(0.25, 0.25, 0.25); // 크기 조정
                this.model.position.y = 0.05; // 타일 위에 위치

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
                if (gltf.animations && gltf.animations.length > 0) {
                    this.mixer = new THREE.AnimationMixer(this.model);
                    this.animations = {};

                    // 모든 애니메이션 저장
                    gltf.animations.forEach((clip) => {
                        this.animations[clip.name] = clip;
                        console.log(`Animation found: ${clip.name}`);
                    });

                    // 기본 애니메이션 재생 (Idle)
                    const idleClip = this.animations['Idle'] || gltf.animations[0];
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

                console.log(`${this.name} 모델 로드 완료`);
            },
            (progress) => {
                // 로딩 진행 상황
                if (progress.total > 0) {
                    const percent = (progress.loaded / progress.total * 100).toFixed(0);
                    console.log(`${this.name} 모델 로딩: ${percent}%`);
                }
            },
            (error) => {
                console.error('모델 로드 실패:', error);
                // 실패 시 기본 모델 유지
            }
        );

        // 캐릭터 데이터 저장 (레이캐스팅용)
        this.mesh.userData.character = this;

        // 메인 그룹에 추가
        this.group.add(this.mesh);
    }

    /**
     * 체력바 UI 생성
     *
     * 캐릭터 위에 표시되는 체력바를 생성합니다.
     */
    createHealthBar() {
        this.healthBarGroup = new THREE.Group();

        // 체력바 배경
        const bgGeometry = new THREE.PlaneGeometry(1, 0.1);
        const bgMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.HEALTH_BAR_BG,
            side: THREE.DoubleSide,
        });
        const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);

        // 체력바 채움
        const fillGeometry = new THREE.PlaneGeometry(1, 0.1);
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: COLORS.HEALTH_BAR_FILL,
            side: THREE.DoubleSide,
        });
        this.healthBarFill = new THREE.Mesh(fillGeometry, fillMaterial);

        // 위치 설정
        bgMesh.position.y = 1.5;
        this.healthBarFill.position.y = 1.5;
        this.healthBarFill.position.z = 0.01; // 배경보다 약간 앞

        // 그룹에 추가
        this.healthBarGroup.add(bgMesh);
        this.healthBarGroup.add(this.healthBarFill);

        // 메인 그룹에 추가
        this.group.add(this.healthBarGroup);

        // 초기 체력바 업데이트
        this.updateHealthBar();
    }

    /**
     * 체력바 업데이트
     */
    updateHealthBar() {
        const healthPercent = this.health / this.maxHealth;

        // 체력 비율에 따라 너비 조정
        this.healthBarFill.scale.x = Math.max(0, healthPercent);

        // 체력에 따라 색상 변경
        if (healthPercent > 0.6) {
            this.healthBarFill.material.color.setHex(0x00ff00); // 녹색
        } else if (healthPercent > 0.3) {
            this.healthBarFill.material.color.setHex(0xffff00); // 노란색
        } else {
            this.healthBarFill.material.color.setHex(0xff0000); // 빨간색
        }

        // 체력바 위치 조정 (중앙 정렬)
        this.healthBarFill.position.x = (healthPercent - 1) * 0.5;
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
     * 다른 타일로 이동
     *
     * @param {HexTile} targetTile - 목표 타일
     * @param {Function} [onComplete] - 이동 완료 콜백
     */
    moveTo(targetTile, onComplete) {
        if (this.hasMoved || targetTile.isOccupied()) {
            console.log('이동 불가: 이미 이동했거나 타일이 점유됨');
            return;
        }

        // 이전 타일에서 제거
        if (this.currentTile) {
            this.currentTile.removeOccupant();
        }

        // 새 타일로 이동
        this.currentTile = targetTile;
        targetTile.setOccupant(this);

        // 애니메이션
        const targetPos = targetTile.getPixelPosition();
        const startPos = {
            x: this.group.position.x,
            z: this.group.position.z
        };

        const startTime = Date.now();
        const duration = ANIMATION.MOVEMENT_DURATION;

        // Play walk animation
        this.playAnimation('Walk', true);

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 이징 함수 (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            // 위치 보간
            this.group.position.x = startPos.x + (targetPos.x - startPos.x) * eased;
            this.group.position.z = startPos.z + (targetPos.z - startPos.z) * eased;

            // 점프 효과
            this.group.position.y = Math.sin(progress * Math.PI) * 0.5;

            // Face the direction of movement
            if (this.model) {
                const angle = Math.atan2(targetPos.x - startPos.x, targetPos.z - startPos.z);
                this.model.rotation.y = angle;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.group.position.y = 0;
                this.hasMoved = true;
                // Return to idle animation
                this.playAnimation('Idle', true);
                if (onComplete) onComplete();
            }
        };

        animate();
    }

    /**
     * 다른 캐릭터 공격
     *
     * @param {Character} target - 공격 대상
     * @param {Function} [onComplete] - 공격 완료 콜백
     * @returns {number} 실제 데미지
     */
    attack(target, onComplete) {
        if (this.hasAttacked) {
            console.log('이미 이번 턴에 공격했습니다');
            return 0;
        }

        // 데미지 계산 (랜덤 변동 포함)
        const variance = Math.floor(Math.random() * (DAMAGE_VARIANCE * 2 + 1)) - DAMAGE_VARIANCE;
        const damage = Math.max(1, this.attackPower + variance);

        // 공격 애니메이션
        const originalPos = { ...this.group.position };
        const direction = new THREE.Vector3(
            target.group.position.x - this.group.position.x,
            0,
            target.group.position.z - this.group.position.z
        ).normalize();

        // Face the target
        if (this.model) {
            const angle = Math.atan2(direction.x, direction.z);
            this.model.rotation.y = angle;
        }

        // Play attack animation
        this.playAnimation('Punch', false);

        const startTime = Date.now();
        const duration = ANIMATION.ATTACK_DURATION;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            if (progress < 0.5) {
                // 전진
                const forward = progress * 2;
                this.group.position.x = originalPos.x + direction.x * forward * 0.3;
                this.group.position.z = originalPos.z + direction.z * forward * 0.3;
            } else {
                // 후퇴
                const backward = (1 - progress) * 2;
                this.group.position.x = originalPos.x + direction.x * backward * 0.3;
                this.group.position.z = originalPos.z + direction.z * backward * 0.3;
            }

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 데미지 적용
                target.takeDamage(damage);
                this.hasAttacked = true;
                // Return to idle animation
                setTimeout(() => {
                    this.playAnimation('Idle', true);
                }, 300);
                if (onComplete) onComplete();
            }
        };

        animate();

        return damage;
    }

    /**
     * 데미지 받기
     *
     * @param {number} damage - 받을 데미지
     */
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        this.updateHealthBar();

        // 피격 효과 (빨간색 플래시)
        const originalColor = this.mesh.children[0].material.color.getHex();
        this.mesh.children.forEach(child => {
            child.material.color.setHex(0xff0000);
        });

        setTimeout(() => {
            this.mesh.children.forEach(child => {
                child.material.color.setHex(originalColor);
            });
        }, 200);

        // 사망 처리
        if (this.health <= 0) {
            this.die();
        }
    }

    /**
     * 캐릭터 사망 처리
     */
    die() {
        console.log(`${this.name} 사망!`);

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

        if (selected) {
            // 선택 강조 효과
            this.mesh.children.forEach(child => {
                child.material.emissive = new THREE.Color(COLORS.CHARACTER_SELECTED);
                child.material.emissiveIntensity = 0.3;
            });
        } else {
            // 강조 제거
            this.mesh.children.forEach(child => {
                child.material.emissive = new THREE.Color(0x000000);
                child.material.emissiveIntensity = 0;
            });
        }
    }

    /**
     * 턴 초기화
     */
    resetTurn() {
        this.hasMoved = false;
        this.hasAttacked = false;
    }

    /**
     * 행동 가능 여부 확인
     *
     * @returns {boolean}
     */
    canAct() {
        return !this.hasMoved || !this.hasAttacked;
    }

    /**
     * 생존 여부 확인
     *
     * @returns {boolean}
     */
    isAlive() {
        return this.health > 0;
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
    }
}
