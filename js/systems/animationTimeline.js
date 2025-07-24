/**
 * 애니메이션 타임라인 시스템
 * 
 * GSAP을 사용하여 복잡한 애니메이션 시퀀스를 관리합니다.
 * 
 * @module animationTimeline
 */

import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js';

/**
 * 애니메이션 타임라인 클래스
 * 
 * @class AnimationTimeline
 */
class AnimationTimeline {
    constructor() {
        /**
         * 활성 타임라인 목록
         * @type {Map<string, gsap.core.Timeline>}
         */
        this.activeTimelines = new Map();
        
        /**
         * 글로벌 타임스케일
         * @type {number}
         */
        this.globalTimeScale = 1;
        
        /**
         * 애니메이션 프리셋
         * @type {Object}
         */
        this.presets = {
            combat: {
                attackDuration: 0.8,
                hitDuration: 0.3,
                moveDuration: 0.5
            },
            movement: {
                walkDuration: 0.5,
                jumpHeight: 0.5,
                dashDuration: 0.3
            },
            ui: {
                fadeInDuration: 0.3,
                fadeOutDuration: 0.2,
                scaleDuration: 0.2
            }
        };
    }
    
    /**
     * 전투 애니메이션 생성
     * 
     * @param {Character} attacker - 공격자
     * @param {Character} target - 대상
     * @param {Object} options - 옵션
     * @returns {gsap.core.Timeline} 생성된 타임라인
     */
    createCombatAnimation(attacker, target, options = {}) {
        const timeline = gsap.timeline({
            id: `combat_${Date.now()}`,
            paused: true,
            onComplete: () => {
                this.removeTimeline(timeline.vars.id);
            }
        });
        
        this.activeTimelines.set(timeline.vars.id, timeline);
        
        return timeline;
    }
    
    /**
     * 이동 애니메이션 생성
     * 
     * @param {Character} character - 캐릭터
     * @param {Array<HexTile>} path - 이동 경로
     * @param {Object} options - 옵션
     * @returns {gsap.core.Timeline} 생성된 타임라인
     */
    createMovementAnimation(character, path, options = {}) {
        const timeline = gsap.timeline({
            id: `movement_${Date.now()}`,
            paused: true,
            onComplete: () => {
                this.removeTimeline(timeline.vars.id);
            }
        });
        
        // 각 타일로의 이동을 타임라인에 추가
        path.forEach((tile, index) => {
            const pos = tile.getPixelPosition();
            const duration = this.presets.movement.walkDuration;
            
            // 이동
            timeline.to(character.group.position, {
                x: pos.x,
                z: pos.z,
                duration: duration,
                ease: 'power2.inOut'
            });
            
            // 점프 효과
            timeline.to(character.group.position, {
                y: this.presets.movement.jumpHeight,
                duration: duration / 2,
                ease: 'power2.out',
                yoyo: true,
                repeat: 1
            }, `-=${duration}`);
            
            // 회전
            if (index < path.length - 1) {
                const nextTile = path[index + 1];
                const nextPos = nextTile.getPixelPosition();
                const angle = Math.atan2(nextPos.x - pos.x, nextPos.z - pos.z);
                
                timeline.call(() => {
                    this.rotateCharacter(character, angle);
                }, null, `-=${duration}`);
            }
        });
        
        this.activeTimelines.set(timeline.vars.id, timeline);
        
        return timeline;
    }
    
    /**
     * 스킬 애니메이션 생성
     * 
     * @param {Character} caster - 시전자
     * @param {string} skillType - 스킬 타입
     * @param {Array<Character>} targets - 대상들
     * @param {Object} options - 옵션
     * @returns {gsap.core.Timeline} 생성된 타임라인
     */
    createSkillAnimation(caster, skillType, targets, options = {}) {
        const timeline = gsap.timeline({
            id: `skill_${Date.now()}`,
            paused: true,
            onComplete: () => {
                this.removeTimeline(timeline.vars.id);
            }
        });
        
        switch (skillType) {
            case 'areaAttack':
                this.addAreaAttackAnimation(timeline, caster, targets, options);
                break;
            case 'buff':
                this.addBuffAnimation(timeline, caster, targets, options);
                break;
            case 'projectile':
                this.addProjectileAnimation(timeline, caster, targets, options);
                break;
            default:
                console.warn(`Unknown skill type: ${skillType}`);
        }
        
        this.activeTimelines.set(timeline.vars.id, timeline);
        
        return timeline;
    }
    
    /**
     * 범위 공격 애니메이션 추가
     * 
     * @param {gsap.core.Timeline} timeline - 타임라인
     * @param {Character} caster - 시전자
     * @param {Array<Character>} targets - 대상들
     * @param {Object} options - 옵션
     */
    addAreaAttackAnimation(timeline, caster, targets, options) {
        // 시전 준비
        timeline
            .to(caster.group.position, {
                y: 0.5,
                duration: 0.3,
                ease: 'power2.out'
            })
            .call(() => {
                caster.playAnimation('Cast', false);
            }, null, 0);
        
        // 충격파 효과
        timeline.call(() => {
            // 여기에 파티클 효과 추가 가능
        }, null, 0.3);
        
        // 타겟들에게 동시 피격
        targets.forEach(target => {
            timeline
                .to(target.group.position, {
                    y: 0.3,
                    duration: 0.1,
                    ease: 'power2.out',
                    yoyo: true,
                    repeat: 1
                }, 0.4)
                .call(() => {
                    this.applyHitEffect(target);
                }, null, 0.4);
        });
        
        // 시전자 복귀
        timeline.to(caster.group.position, {
            y: 0,
            duration: 0.3,
            ease: 'power2.in'
        }, 0.6);
    }
    
    /**
     * 버프 애니메이션 추가
     * 
     * @param {gsap.core.Timeline} timeline - 타임라인
     * @param {Character} caster - 시전자
     * @param {Array<Character>} targets - 대상들
     * @param {Object} options - 옵션
     */
    addBuffAnimation(timeline, caster, targets, options) {
        // 시전 모션
        timeline
            .call(() => {
                caster.playAnimation('Cast', false);
            })
            .to(caster.group.scale, {
                x: 1.1,
                y: 1.1,
                z: 1.1,
                duration: 0.3,
                yoyo: true,
                repeat: 1,
                ease: 'power2.inOut'
            });
        
        // 버프 효과
        targets.forEach((target, index) => {
            timeline
                .to(target.mesh, {
                    emissiveIntensity: 0.5,
                    duration: 0.5,
                    ease: 'power2.inOut'
                }, 0.3 + index * 0.1)
                .to(target.group.scale, {
                    x: 1.05,
                    y: 1.05,
                    z: 1.05,
                    duration: 0.3,
                    ease: 'back.out(2)'
                }, 0.3 + index * 0.1);
        });
    }
    
    /**
     * 투사체 애니메이션 추가
     * 
     * @param {gsap.core.Timeline} timeline - 타임라인
     * @param {Character} caster - 시전자
     * @param {Array<Character>} targets - 대상들
     * @param {Object} options - 옵션
     */
    addProjectileAnimation(timeline, caster, targets, options) {
        // 투사체는 별도 오브젝트 생성이 필요하므로 여기서는 간단히 구현
        targets.forEach((target, index) => {
            const delay = index * 0.2;
            
            timeline
                .call(() => {
                    caster.playAnimation('Cast', false);
                }, null, delay)
                .call(() => {
                    // 투사체 효과 (실제로는 3D 오브젝트 생성 필요)
                    this.applyHitEffect(target);
                }, null, delay + 0.5);
        });
    }
    
    /**
     * 캐릭터 회전 애니메이션
     * 
     * @param {Character} character - 캐릭터
     * @param {number} angle - 회전 각도
     * @param {number} duration - 지속 시간
     */
    rotateCharacter(character, angle, duration = 0.2) {
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
    applyHitEffect(character) {
        // 흔들림
        gsap.to(character.group.position, {
            x: character.group.position.x + (Math.random() - 0.5) * 0.1,
            z: character.group.position.z + (Math.random() - 0.5) * 0.1,
            duration: 0.05,
            yoyo: true,
            repeat: 3,
            ease: 'power2.inOut'
        });
    }
    
    /**
     * 타임라인 재생
     * 
     * @param {string} id - 타임라인 ID
     * @returns {gsap.core.Timeline|null}
     */
    playTimeline(id) {
        const timeline = this.activeTimelines.get(id);
        if (timeline) {
            timeline.timeScale(this.globalTimeScale);
            timeline.play();
            return timeline;
        }
        return null;
    }
    
    /**
     * 타임라인 일시정지
     * 
     * @param {string} id - 타임라인 ID
     */
    pauseTimeline(id) {
        const timeline = this.activeTimelines.get(id);
        if (timeline) {
            timeline.pause();
        }
    }
    
    /**
     * 타임라인 제거
     * 
     * @param {string} id - 타임라인 ID
     */
    removeTimeline(id) {
        const timeline = this.activeTimelines.get(id);
        if (timeline) {
            timeline.kill();
            this.activeTimelines.delete(id);
        }
    }
    
    /**
     * 모든 타임라인 정지
     */
    stopAll() {
        this.activeTimelines.forEach(timeline => {
            timeline.kill();
        });
        this.activeTimelines.clear();
    }
    
    /**
     * 글로벌 타임스케일 설정
     * 
     * @param {number} scale - 타임스케일 (0.1 ~ 2.0)
     */
    setGlobalTimeScale(scale) {
        this.globalTimeScale = Math.max(0.1, Math.min(2, scale));
        
        // 활성 타임라인에 적용
        this.activeTimelines.forEach(timeline => {
            timeline.timeScale(this.globalTimeScale);
        });
    }
    
    /**
     * 활성 타임라인 수 반환
     * 
     * @returns {number}
     */
    getActiveCount() {
        return this.activeTimelines.size;
    }
}

// 싱글톤 인스턴스
export const animationTimeline = new AnimationTimeline();