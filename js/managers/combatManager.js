/**
 * 전투 매니저
 * 
 * 전투와 관련된 모든 로직을 중앙에서 관리합니다.
 * 애니메이션, 데미지 계산, 전투 흐름 제어를 담당합니다.
 * 
 * @module combatManager
 */

import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';
import { soundSystem } from '../systems/soundSystem.js';
import { ANIMATION } from '../core/constants.js';
import { healthBarUI } from '../ui/healthBarUI.js';

/**
 * 전투 매니저 클래스
 * 
 * @class CombatManager
 */
class CombatManager {
    constructor() {
        /**
         * 현재 진행 중인 전투
         * @type {Object|null}
         */
        this.currentCombat = null;
        
        /**
         * 전투 타임라인
         * @type {gsap.core.Timeline|null}
         */
        this.combatTimeline = null;
        
        /**
         * 전투 완료 콜백
         * @type {Function|null}
         */
        this.onCombatComplete = null;
        
        /**
         * 데미지 적용 콜백
         * @type {Function|null}
         */
        this.onDamageDealt = null;
    }
    
    /**
     * 전투 시작
     * 
     * @param {Character} attacker - 공격자
     * @param {Character} target - 대상
     * @param {Object} options - 전투 옵션
     * @returns {Promise<Object>} 전투 결과
     */
    async startCombat(attacker, target, options = {}) {
        // 이미 전투 중인 경우
        if (this.currentCombat) {
            console.warn('Combat already in progress');
            return null;
        }
        
        // 전투 정보 설정
        this.currentCombat = {
            attacker,
            target,
            damage: this.calculateDamage(attacker, target, options),
            startTime: Date.now(),
            options
        };
        
        // 전투 타임라인 생성
        this.createCombatTimeline();
        
        // 타임라인 실행 및 완료 대기
        return new Promise((resolve) => {
            this.combatTimeline.eventCallback('onComplete', () => {
                const result = {
                    attacker: this.currentCombat.attacker,
                    target: this.currentCombat.target,
                    damage: this.currentCombat.damage,
                    duration: Date.now() - this.currentCombat.startTime
                };
                
                // 전투 정보 초기화
                this.currentCombat = null;
                this.combatTimeline = null;
                
                // 콜백 실행
                if (this.onCombatComplete) {
                    this.onCombatComplete(result);
                }
                
                resolve(result);
            });
            
            // 타임라인 시작
            this.combatTimeline.play();
        });
    }
    
    /**
     * 전투 타임라인 생성
     */
    createCombatTimeline() {
        const { attacker, target, damage } = this.currentCombat;
        
        // 타임라인 생성
        this.combatTimeline = gsap.timeline({
            paused: true,
            defaults: {
                ease: 'power2.inOut'
            }
        });
        
        // 원래 위치 저장
        const attackerPos = {
            x: attacker.group.position.x,
            z: attacker.group.position.z
        };
        
        // 공격 방향 계산
        const direction = {
            x: target.group.position.x - attacker.group.position.x,
            z: target.group.position.z - attacker.group.position.z
        };
        
        // 방향 정규화
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        direction.x /= length;
        direction.z /= length;
        
        // 공격자 회전
        const attackerAngle = Math.atan2(direction.x, direction.z);
        const targetAngle = Math.atan2(-direction.x, -direction.z);
        
        // 타임라인 구성
        this.combatTimeline
            // 1. 준비 단계 - 서로 마주보기
            .call(() => {
                this.rotateCharacter(attacker, attackerAngle);
                this.rotateCharacter(target, targetAngle);
            })
            .to({}, { duration: 0.2 }) // 회전 대기
            
            // 2. 공격 애니메이션 시작
            .call(() => {
                attacker.playAnimation('Punch', false);
                soundSystem.playAttack();
            })
            
            // 3. 전진 이동
            .to(attacker.group.position, {
                x: attackerPos.x + direction.x * 0.5,
                z: attackerPos.z + direction.z * 0.5,
                duration: ANIMATION.ATTACK_DURATION * 0.4,
                ease: 'power2.in'
            })
            
            // 4. 타격 순간
            .call(() => {
                // 피격 효과
                this.applyHitEffect(target);
                soundSystem.playHit();
                
                // 데미지 적용
                this.applyDamage(target, damage);
                
                // 피격 애니메이션
                target.playAnimation('Hit', false);
                
                // 콜백 실행
                if (this.onDamageDealt) {
                    this.onDamageDealt(attacker, target, damage);
                }
            })
            
            // 5. 넉백 효과
            .to(target.group.position, {
                x: target.group.position.x + direction.x * 0.2,
                z: target.group.position.z + direction.z * 0.2,
                duration: 0.1,
                ease: 'power2.out'
            })
            
            // 6. 복귀
            .to(attacker.group.position, {
                x: attackerPos.x,
                z: attackerPos.z,
                duration: ANIMATION.ATTACK_DURATION * 0.4,
                ease: 'power2.out'
            })
            
            // 7. 타겟 원위치
            .to(target.group.position, {
                x: target.group.position.x - direction.x * 0.2,
                z: target.group.position.z - direction.z * 0.2,
                duration: 0.2,
                ease: 'back.out(2)'
            }, '-=0.2')
            
            // 8. 대기 애니메이션으로 복귀
            .call(() => {
                attacker.playAnimation('Idle', true);
                if (target.isAlive()) {
                    target.playAnimation('Idle', true);
                }
            }, null, '+=0.1');
    }
    
    /**
     * 캐릭터 회전
     * 
     * @param {Character} character - 캐릭터
     * @param {number} angle - 회전 각도 (라디안)
     */
    rotateCharacter(character, angle) {
        character.facingDirection = angle;
        
        const rotationTarget = character.model || character.mesh;
        if (rotationTarget) {
            gsap.to(rotationTarget.rotation, {
                y: angle,
                duration: 0.2,
                ease: 'power2.inOut'
            });
        }
    }
    
    /**
     * 피격 효과 적용
     * 
     * @param {Character} character - 피격 캐릭터
     */
    applyHitEffect(character) {
        // 빨간색 플래시 효과
        const originalColors = new Map();
        
        character.mesh.traverse(child => {
            if (child.isMesh && child.material && child.material.color) {
                originalColors.set(child, child.material.color.getHex());
                
                // 빨간색으로 변경
                gsap.to(child.material.color, {
                    r: 1,
                    g: 0,
                    b: 0,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        child.material.color.setHex(originalColors.get(child));
                    }
                });
            }
        });
        
        // 흔들림 효과
        gsap.to(character.group.rotation, {
            z: 0.1,
            duration: 0.05,
            yoyo: true,
            repeat: 3,
            ease: 'power2.inOut',
            onComplete: () => {
                character.group.rotation.z = 0;
            }
        });
    }
    
    /**
     * 데미지 적용
     * 
     * @param {Character} target - 대상
     * @param {number} damage - 데미지
     */
    applyDamage(target, damage) {
        target.health = Math.max(0, target.health - damage);
        
        // 체력바 업데이트
        healthBarUI.updateHealthBar(target);
        
        // 사망 처리
        if (target.health <= 0 && !target.isDying) {
            this.handleDeath(target);
        }
    }
    
    /**
     * 사망 처리
     * 
     * @param {Character} character - 사망한 캐릭터
     */
    handleDeath(character) {
        character.isDying = true;
        
        // 사망 애니메이션 타임라인
        const deathTimeline = gsap.timeline();
        
        deathTimeline
            // 쓰러지기
            .to(character.group.rotation, {
                x: -Math.PI / 2,
                duration: 0.5,
                ease: 'power2.in'
            })
            // 페이드 아웃
            .to(character.group, {
                opacity: 0,
                duration: 0.5,
                onUpdate: () => {
                    character.group.traverse(child => {
                        if (child.material) {
                            child.material.opacity = character.group.opacity;
                            child.material.transparent = true;
                        }
                    });
                }
            })
            // 아래로 가라앉기
            .to(character.group.position, {
                y: -1,
                duration: 0.5,
                ease: 'power2.in'
            }, '-=0.5')
            .call(() => {
                character.die();
            });
    }
    
    /**
     * 데미지 계산
     * 
     * @param {Character} attacker - 공격자
     * @param {Character} target - 대상
     * @param {Object} options - 추가 옵션
     * @returns {number} 계산된 데미지
     */
    calculateDamage(attacker, target, options = {}) {
        let damage = attacker.attackPower;
        
        // 데미지 변동
        const variance = Math.floor(Math.random() * 5) - 2;
        damage += variance;
        
        // 치명타 계산
        if (Math.random() < 0.1) { // 10% 치명타 확률
            damage *= 2;
            options.isCritical = true;
        }
        
        // 최소 데미지 보장
        return Math.max(1, Math.floor(damage));
    }
    
    /**
     * 현재 전투 취소
     */
    cancelCombat() {
        if (this.combatTimeline) {
            this.combatTimeline.kill();
            this.combatTimeline = null;
        }
        
        this.currentCombat = null;
    }
    
    /**
     * 전투 중 여부 확인
     * 
     * @returns {boolean}
     */
    isInCombat() {
        return this.currentCombat !== null;
    }
}

// 싱글톤 인스턴스
export const combatManager = new CombatManager();