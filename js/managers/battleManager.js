/**
 * 배틀 매니저
 * 
 * 전투 로직과 애니메이션을 분리하여 관리합니다.
 * 모든 전투 행동은 즉시 처리되고, 시각적 표현은 별도로 처리됩니다.
 * 
 * @module battleManager
 */

import { actionQueue, ActionType } from '../systems/actionQueue.js';
import { animationController } from '../systems/animationController.js';
import { gameState } from '../core/gameState.js';
import { healthBarUI } from '../ui/healthBarUI.js';

/**
 * 배틀 매니저 클래스
 * 
 * @class BattleManager
 */
class BattleManager {
    constructor() {
        /**
         * 초기화 여부
         * @type {boolean}
         */
        this.initialized = false;
        
        /**
         * 배틀 진행 중 여부
         * @type {boolean}
         */
        this.inBattle = false;
        
        /**
         * 콜백 함수들
         * @type {Object}
         */
        this.callbacks = {
            onMoveComplete: null,
            onAttackComplete: null,
            onDamageDealt: null,
            onCharacterDeath: null,
            onBattleEnd: null
        };
    }
    
    /**
     * 초기화
     */
    init() {
        if (this.initialized) return;
        
        console.log('battleManager.init() called');
        
        // 액션 핸들러 등록
        actionQueue.registerHandler(ActionType.MOVE, (data, options) => {
            console.log('MOVE handler called', data);
            return animationController.createMoveAnimation(data, options);
        });
        
        actionQueue.registerHandler(ActionType.ATTACK, (data, options) => 
            animationController.createAttackAnimation(data, options)
        );
        
        actionQueue.registerHandler(ActionType.DAMAGE, (data, options) => 
            animationController.createDamageAnimation(data, options)
        );
        
        actionQueue.registerHandler(ActionType.DEATH, (data, options) => 
            animationController.createDeathAnimation(data, options)
        );
        
        // 큐 완료 콜백
        actionQueue.onQueueEmpty = () => {
            this.onQueueEmpty();
        };
        
        this.initialized = true;
        console.log('battleManager initialized');
    }
    
    /**
     * 캐릭터 이동
     * 
     * @param {Character} character - 캐릭터
     * @param {Array<HexTile>} path - 이동 경로
     * @returns {boolean} 이동 성공 여부
     */
    moveCharacter(character, path) {
        if (!character || !path || path.length === 0) {
            return false;
        }
        
        // 즉시 로직 처리
        const startTile = character.currentTile;
        const endTile = path[path.length - 1];
        
        // 타일 점유 상태 업데이트
        if (startTile) {
            startTile.removeOccupant();
        }
        
        character.currentTile = endTile;
        endTile.setOccupant(character, false); // 위치는 애니메이션이 처리
        
        // 캐릭터 상태 업데이트
        character.hasMoved = true;
        character.movedDistance += path.length;
        
        // 애니메이션 큐에 추가
        actionQueue.enqueueMove(character, path, {
            onComplete: () => {
                if (this.callbacks.onMoveComplete) {
                    this.callbacks.onMoveComplete(character);
                }
            }
        });
        
        return true;
    }
    
    /**
     * 캐릭터 공격
     * 
     * @param {Character} attacker - 공격자
     * @param {Character} target - 대상
     * @returns {number} 데미지 (0이면 실패)
     */
    performAttack(attacker, target) {
        if (!attacker || !target || attacker.hasAttacked) {
            return 0;
        }
        
        // 데미지 계산 (즉시)
        const damage = this.calculateDamage(attacker, target);
        
        // 상태 업데이트 (즉시)
        attacker.hasAttacked = true;
        target.health = Math.max(0, target.health - damage);
        
        // 애니메이션 큐에 추가
        actionQueue.enqueueAttack(attacker, target, damage, {
            onHit: () => {
                // 데미지 애니메이션 추가
                actionQueue.enqueueDamage(target, damage, {
                    onComplete: () => {
                        if (this.callbacks.onDamageDealt) {
                            this.callbacks.onDamageDealt(attacker, target, damage);
                        }
                    }
                });
                
                // 사망 체크
                if (target.health <= 0) {
                    this.handleCharacterDeath(target);
                }
            }
        });
        
        return damage;
    }
    
    /**
     * 캐릭터 사망 처리
     * 
     * @param {Character} character - 사망한 캐릭터
     */
    handleCharacterDeath(character) {
        // 즉시 처리
        character.isDead = true;
        
        // 타일에서 제거
        if (character.currentTile) {
            character.currentTile.removeOccupant();
        }
        
        // 게임 상태에서 제거
        gameState.removeDeadCharacter(character);
        
        // 애니메이션 큐에 추가
        actionQueue.enqueueDeath(character, {
            onComplete: () => {
                if (this.callbacks.onCharacterDeath) {
                    this.callbacks.onCharacterDeath(character);
                }
                
                // 게임 종료 체크
                this.checkGameEnd();
            }
        });
    }
    
    /**
     * 데미지 계산
     * 
     * @param {Character} attacker - 공격자
     * @param {Character} target - 대상
     * @returns {number} 계산된 데미지
     */
    calculateDamage(attacker, target) {
        let damage = attacker.attackPower;
        
        // 랜덤 변동 (-2 ~ +2)
        const variance = Math.floor(Math.random() * 5) - 2;
        damage += variance;
        
        // 치명타 (10% 확률)
        if (Math.random() < 0.1) {
            damage *= 2;
        }
        
        return Math.max(1, Math.floor(damage));
    }
    
    /**
     * 게임 종료 체크
     */
    checkGameEnd() {
        const alivePlayerCount = gameState.getAlivePlayerCount();
        const aliveEnemyCount = gameState.getAliveEnemyCount();
        
        if (alivePlayerCount === 0) {
            gameState.setGameState('player_lost');
            if (this.callbacks.onBattleEnd) {
                this.callbacks.onBattleEnd('player_lost');
            }
        } else if (aliveEnemyCount === 0) {
            gameState.setGameState('player_won');
            if (this.callbacks.onBattleEnd) {
                this.callbacks.onBattleEnd('player_won');
            }
        }
    }
    
    /**
     * 큐 비었을 때 처리
     */
    onQueueEmpty() {
        // 현재 턴의 모든 액션이 완료됨
        console.log('All animations completed');
    }
    
    /**
     * 애니메이션 속도 설정
     * 
     * @param {number} speed - 속도 (0.1 ~ 5.0)
     */
    setAnimationSpeed(speed) {
        animationController.setAnimationSpeed(speed);
    }
    
    /**
     * 스킵 모드 설정
     * 
     * @param {boolean} enabled - 활성화 여부
     */
    setSkipMode(enabled) {
        animationController.setSkipMode(enabled);
    }
    
    /**
     * 현재 애니메이션 스킵
     */
    skipCurrent() {
        actionQueue.skipCurrent();
    }
    
    /**
     * 모든 애니메이션 스킵
     */
    skipAll() {
        actionQueue.skipAll();
    }
    
    /**
     * 일시정지
     */
    pause() {
        actionQueue.pause();
        animationController.pause();
    }
    
    /**
     * 재개
     */
    resume() {
        actionQueue.resume();
        animationController.resume();
    }
    
    /**
     * 상태 반환
     * 
     * @returns {Object} 현재 상태
     */
    getStatus() {
        return {
            queueStatus: actionQueue.getStatus(),
            inBattle: this.inBattle
        };
    }
}

// 싱글톤 인스턴스
export const battleManager = new BattleManager();