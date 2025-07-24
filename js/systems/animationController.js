/**
 * 애니메이션 컨트롤러
 * 
 * 액션 큐와 연동되어 시각적 애니메이션을 처리합니다.
 * 로직과 완전히 분리되어 있어 스킵, 속도 조절이 가능합니다.
 * 
 * @module animationController
 */

import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { soundSystem } from './soundSystem.js';
import { healthBarUI } from '../ui/healthBarUI.js';
import { ANIMATION } from '../core/constants.js';
import { eventBus, GameEvents } from '../core/eventBus.js';

/**
 * 애니메이션 컨트롤러 클래스
 * 
 * @class AnimationController
 */
class AnimationController {
    constructor() {
        /**
         * 현재 타임라인
         * @type {gsap.core.Timeline|null}
         */
        this.currentTimeline = null;
        
        /**
         * 애니메이션 속도
         * @type {number}
         */
        this.animationSpeed = 1.0;
        
        /**
         * 콜백 맵
         * @type {Map<string, Function>}
         */
        this.callbacks = new Map();
        
        /**
         * 스킵 모드
         * @type {boolean}
         */
        this.skipMode = false;
        
        // 스킵 이벤트 리스너
        window.addEventListener('actionSkip', (e) => {
            this.skipCurrentAnimation();
        });
    }
    
    /**
     * 이동 애니메이션 생성
     * 
     * @param {Object} data - 이동 데이터
     * @param {Object} options - 옵션
     * @returns {Promise}
     */
    createMoveAnimation(data, options = {}) {
        const { character, path } = data;
        
        return new Promise((resolve) => {
            // 즉시 해결 (스킵 모드)
            if (this.skipMode) {
                const finalPos = path[path.length - 1].getPixelPosition();
                character.setPosition(finalPos.x, finalPos.z);
                character.playAnimation('Idle', true);
                resolve();
                return;
            }
            
            // 타임라인 생성
            const timeline = gsap.timeline({
                onComplete: () => {
                    character.playAnimation('Idle', true);
                    this.currentTimeline = null;
                    
                    // 이동 완료 이벤트 발생
                    eventBus.emit(GameEvents.MOVE_ANIMATION_COMPLETE, { character });
                    
                    resolve();
                }
            });
            
            this.currentTimeline = timeline;
            
            // 각 타일로의 이동 애니메이션
            let previousPos = {
                x: character.group.position.x,
                z: character.group.position.z
            };
            
            path.forEach((tile, index) => {
                const pos = tile.getPixelPosition();
                const duration = (ANIMATION.MOVEMENT_DURATION * 0.8 / this.animationSpeed) / 1000; // ms to seconds
                
                // 회전
                const direction = {
                    x: pos.x - previousPos.x,
                    z: pos.z - previousPos.z
                };
                
                if (Math.abs(direction.x) > 0.01 || Math.abs(direction.z) > 0.01) {
                    const angle = Math.atan2(direction.x, direction.z);
                    
                    timeline.call(() => {
                        character.facingDirection = angle;
                        const rotationTarget = character.model || character.mesh;
                        if (rotationTarget) {
                            gsap.to(rotationTarget.rotation, {
                                y: angle,
                                duration: 0.2 / this.animationSpeed,
                                ease: 'power2.inOut'
                            });
                        }
                    });
                }
                
                // 걷기 애니메이션 시작
                if (index === 0) {
                    timeline.call(() => {
                        character.playAnimation('Walk', true);
                        soundSystem.playMove();
                    });
                }
                
                // 이동
                timeline.to(character.group.position, {
                    x: pos.x,
                    z: pos.z,
                    duration: duration,
                    ease: 'power2.inOut',
                    ease: 'power2.inOut'
                });
                
                // 점프 효과
                timeline.to(character.group.position, {
                    y: 0.3,
                    duration: duration / 2,
                    ease: 'power2.out',
                    yoyo: true,
                    repeat: 1
                }, `-=${duration}`);
                
                previousPos = { x: pos.x, z: pos.z };
            });
            
            // UI 업데이트 콜백
            if (options.onComplete) {
                timeline.call(options.onComplete);
            }
            
            timeline.play();
        });
    }
    
    /**
     * 공격 애니메이션 생성
     * 
     * @param {Object} data - 공격 데이터
     * @param {Object} options - 옵션
     * @returns {Promise}
     */
    createAttackAnimation(data, options = {}) {
        const { attacker, target, damage, attackerPos, targetPos } = data;
        
        return new Promise((resolve) => {
            // 즉시 해결 (스킵 모드)
            if (this.skipMode) {
                attacker.playAnimation('Idle', true);
                target.playAnimation('Idle', true);
                resolve();
                return;
            }
            
            // 타임라인 생성
            const timeline = gsap.timeline({
                onComplete: () => {
                    this.currentTimeline = null;
                    
                    // 공격 완료 이벤트 발생
                    eventBus.emit(GameEvents.ATTACK_ANIMATION_COMPLETE, { attacker });
                    
                    resolve();
                }
            });
            
            this.currentTimeline = timeline;
            
            // 방향 계산
            const direction = {
                x: targetPos.x - attackerPos.x,
                z: targetPos.z - attackerPos.z
            };
            
            const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
            direction.x /= length;
            direction.z /= length;
            
            // 회전 각도
            const attackerAngle = Math.atan2(direction.x, direction.z);
            const targetAngle = Math.atan2(-direction.x, -direction.z);
            
            timeline
                // 1. 서로 마주보기
                .call(() => {
                    this.rotateCharacter(attacker, attackerAngle, 0.2 / this.animationSpeed);
                    this.rotateCharacter(target, targetAngle, 0.2 / this.animationSpeed);
                })
                .to({}, { duration: 0.2 / this.animationSpeed })
                
                // 2. 공격 애니메이션 시작
                .call(() => {
                    attacker.playAnimation('Punch', false);
                    soundSystem.playAttack();
                })
                
                // 3. 전진
                .to(attacker.group.position, {
                    x: attackerPos.x + direction.x * 0.5,
                    z: attackerPos.z + direction.z * 0.5,
                    duration: (ANIMATION.ATTACK_DURATION * 0.4 / this.animationSpeed) / 1000,
                    ease: 'power2.in'
                })
                
                // 4. 타격 (40% 시점)
                .call(() => {
                    // 피격 효과
                    this.createHitEffect(target);
                    soundSystem.playHit();
                    
                    // 피격 애니메이션
                    target.playAnimation('Hit', false);
                    
                    // 데미지 텍스트 표시
                    this.showDamageText(target, damage);
                    
                    // 체력바 업데이트
                    healthBarUI.updateHealthBar(target);
                    
                    // UI 업데이트 콜백
                    if (options.onHit) {
                        options.onHit();
                    }
                })
                
                // 5. 넉백
                .to(target.group.position, {
                    x: targetPos.x + direction.x * 0.2,
                    z: targetPos.z + direction.z * 0.2,
                    duration: 0.1 / this.animationSpeed,
                    ease: 'power2.out'
                })
                
                // 6. 공격자 복귀
                .to(attacker.group.position, {
                    x: attackerPos.x,
                    z: attackerPos.z,
                    duration: (ANIMATION.ATTACK_DURATION * 0.4 / this.animationSpeed) / 1000,
                    ease: 'power2.out'
                })
                
                // 7. 타겟 복귀
                .to(target.group.position, {
                    x: targetPos.x,
                    z: targetPos.z,
                    duration: 0.2 / this.animationSpeed,
                    ease: 'back.out(2)'
                }, '-=0.2')
                
                // 8. Idle 복귀
                .call(() => {
                    attacker.playAnimation('Idle', true);
                    if (target.isAlive()) {
                        target.playAnimation('Idle', true);
                    }
                }, null, '+=0.1');
            
            timeline.play();
        });
    }
    
    /**
     * 데미지 애니메이션 생성 (더 이상 사용하지 않음)
     * 
     * @param {Object} data - 데미지 데이터
     * @param {Object} options - 옵션
     * @returns {Promise}
     */
    createDamageAnimation(data, options = {}) {
        // 공격 애니메이션에 통합되어 더 이상 별도로 호출되지 않음
        return Promise.resolve();
    }
    
    /**
     * 사망 애니메이션 생성
     * 
     * @param {Object} data - 사망 데이터
     * @param {Object} options - 옵션
     * @returns {Promise}
     */
    createDeathAnimation(data, options = {}) {
        const { character } = data;
        
        return new Promise((resolve) => {
            // 즉시 해결 (스킵 모드)
            if (this.skipMode) {
                character.group.visible = false;
                resolve();
                return;
            }
            
            const timeline = gsap.timeline({
                onComplete: () => {
                    this.currentTimeline = null;
                    resolve();
                }
            });
            
            this.currentTimeline = timeline;
            
            timeline
                // 쓰러지기
                .to(character.group.rotation, {
                    x: -Math.PI / 2,
                    duration: 0.5 / this.animationSpeed,
                    ease: 'power2.in'
                })
                // 페이드 아웃
                .to(character.group, {
                    opacity: 0,
                    duration: 0.5 / this.animationSpeed,
                    onUpdate: () => {
                        character.group.traverse(child => {
                            if (child.material) {
                                child.material.opacity = character.group.opacity;
                                child.material.transparent = true;
                            }
                        });
                    }
                })
                // 가라앉기
                .to(character.group.position, {
                    y: -1,
                    duration: 0.5 / this.animationSpeed,
                    ease: 'power2.in'
                }, '-=0.5');
            
            timeline.play();
        });
    }
    
    /**
     * 캐릭터 회전
     * 
     * @param {Character} character - 캐릭터
     * @param {number} angle - 각도
     * @param {number} duration - 지속시간
     */
    rotateCharacter(character, angle, duration) {
        character.facingDirection = angle;
        const rotationTarget = character.model || character.mesh;
        if (rotationTarget) {
            gsap.to(rotationTarget.rotation, {
                y: angle,
                duration: duration,
                ease: 'power2.inOut'
            });
        }
    }
    
    /**
     * 피격 효과
     * 
     * @param {Character} character - 캐릭터
     */
    createHitEffect(character) {
        // 빨간색 플래시
        const originalColors = new Map();
        
        character.mesh.traverse(child => {
            if (child.isMesh && child.material && child.material.color) {
                originalColors.set(child, child.material.color.getHex());
                
                gsap.to(child.material.color, {
                    r: 1,
                    g: 0,
                    b: 0,
                    duration: 0.1 / this.animationSpeed,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        child.material.color.setHex(originalColors.get(child));
                    }
                });
            }
        });
        
        // 흔들림
        gsap.to(character.group.rotation, {
            z: 0.1,
            duration: 0.05 / this.animationSpeed,
            yoyo: true,
            repeat: 3,
            ease: 'power2.inOut',
            onComplete: () => {
                character.group.rotation.z = 0;
            }
        });
    }
    
    /**
     * 데미지 텍스트 표시
     * 
     * @param {Character} character - 캐릭터
     * @param {number} damage - 데미지
     */
    showDamageText(character, damage) {
        // 데미지 텍스트 UI 구현 (추후 3D 텍스트로 대체 가능)
        const damageEvent = new CustomEvent('showDamage', {
            detail: { character, damage }
        });
        window.dispatchEvent(damageEvent);
    }
    
    /**
     * 현재 애니메이션 건너뛰기
     */
    skipCurrentAnimation() {
        if (this.currentTimeline) {
            this.currentTimeline.progress(1);
            this.currentTimeline.kill();
            this.currentTimeline = null;
        }
    }
    
    /**
     * 애니메이션 속도 설정
     * 
     * @param {number} speed - 속도 (0.1 ~ 5.0)
     */
    setAnimationSpeed(speed) {
        this.animationSpeed = Math.max(0.1, Math.min(5, speed));
        
        if (this.currentTimeline) {
            this.currentTimeline.timeScale(this.animationSpeed);
        }
    }
    
    /**
     * 스킵 모드 설정
     * 
     * @param {boolean} enabled - 활성화 여부
     */
    setSkipMode(enabled) {
        this.skipMode = enabled;
        
        if (enabled && this.currentTimeline) {
            this.skipCurrentAnimation();
        }
    }
    
    /**
     * 애니메이션 일시정지
     */
    pause() {
        if (this.currentTimeline) {
            this.currentTimeline.pause();
        }
    }
    
    /**
     * 애니메이션 재개
     */
    resume() {
        if (this.currentTimeline) {
            this.currentTimeline.resume();
        }
    }
}

// 싱글톤 인스턴스
export const animationController = new AnimationController();