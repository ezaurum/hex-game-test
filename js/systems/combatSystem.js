/**
 * 전투 시스템
 * 
 * 공격, 데미지 계산, 전투 로그 등 전투 관련 기능을 담당합니다.
 * 
 * @module combatSystem
 */

import { gameState } from '../core/gameState.js';
import { gridSystem } from './gridSystem.js';
import { battleManager } from '../managers/battleManager.js';

/**
 * 전투 시스템 클래스
 * 
 * @class CombatSystem
 */
export class CombatSystem {
    constructor() {
        /**
         * 전투 로그 콜백 함수
         * @type {Function}
         */
        this.onCombatLog = null;
        
        /**
         * 캐릭터 사망 콜백 함수
         * @type {Function}
         */
        this.onCharacterDeath = null;
        
        /**
         * 전투 종료 콜백 함수
         * @type {Function}
         */
        this.onCombatEnd = null;
    }
    
    /**
     * 공격 실행 (새로운 배틀 매니저 사용)
     * 
     * @param {Character} attacker - 공격자
     * @param {Character} target - 대상
     * @param {Function} [callback] - 공격 완료 콜백
     * @returns {boolean} 공격 성공 여부
     */
    performAttack(attacker, target, callback) {
        // 유효성 검사
        if (!this.canAttack(attacker, target)) {
            return false;
        }
        
        // 콜백 설정
        const originalCallbacks = { ...battleManager.callbacks };
        
        battleManager.callbacks.onDamageDealt = (attacker, target, damage) => {
            // 전투 로그 추가
            this.addCombatLog(
                `${attacker.name}이(가) ${target.name}에게 ${damage}의 데미지를 입혔습니다!`
            );
        };
        
        battleManager.callbacks.onCharacterDeath = (character) => {
            this.handleCharacterDeath(character);
        };
        
        // 배틀 매니저를 통한 공격 실행
        const damage = battleManager.performAttack(attacker, target);
        
        // 콜백 실행
        if (callback) {
            // 애니메이션 완료 후 콜백 실행
            setTimeout(callback, 100);
        }
        
        // 원래 콜백 복원
        setTimeout(() => {
            battleManager.callbacks = originalCallbacks;
        }, 2000);
        
        return damage > 0;
    }
    
    /**
     * 공격 가능 여부 확인
     * 
     * @param {Character} attacker - 공격자
     * @param {Character} target - 대상
     * @returns {boolean} 공격 가능 여부
     */
    canAttack(attacker, target) {
        // 기본 검사
        if (!attacker || !target) return false;
        if (!attacker.isAlive() || !target.isAlive()) return false;
        if (attacker.hasAttacked) return false;
        if (attacker.type === target.type) return false; // 같은 팀 공격 불가
        
        // 거리 검사
        const distance = attacker.currentTile.distanceTo(target.currentTile);
        if (distance > attacker.attackRange) return false;
        
        // 시야선 검사 (원거리 공격의 경우)
        if (attacker.attackRange > 1) {
            if (!gridSystem.hasLineOfSight(attacker.currentTile, target.currentTile)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 범위 공격 실행
     * 
     * @param {Character} attacker - 공격자
     * @param {HexTile} centerTile - 중심 타일
     * @param {number} radius - 공격 범위
     * @param {number} damageMultiplier - 데미지 배율
     * @param {Function} [callback] - 완료 콜백
     */
    performAreaAttack(attacker, centerTile, radius, damageMultiplier = 1, callback) {
        const affectedTiles = gridSystem.getTilesInRange(centerTile, radius);
        const targets = [];
        
        // 영향받는 대상 찾기
        for (const tile of affectedTiles) {
            if (tile.isOccupied() && tile.occupant.type !== attacker.type) {
                targets.push(tile.occupant);
            }
        }
        
        // 각 대상에게 데미지
        let completedAttacks = 0;
        const totalTargets = targets.length;
        
        if (totalTargets === 0) {
            if (callback) callback();
            return;
        }
        
        targets.forEach(target => {
            const damage = Math.floor(attacker.attackPower * damageMultiplier);
            
            // 데미지 적용 (애니메이션 없이)
            target.takeDamage(damage);
            
            this.addCombatLog(
                `${attacker.name}의 범위 공격이 ${target.name}에게 ${damage}의 데미지!`
            );
            
            // 사망 체크
            if (!target.isAlive()) {
                this.handleCharacterDeath(target);
            }
            
            completedAttacks++;
            if (completedAttacks === totalTargets && callback) {
                callback();
            }
        });
    }
    
    /**
     * 연속 공격 실행
     * 
     * @param {Character} attacker - 공격자
     * @param {Character[]} targets - 대상 목록
     * @param {Function} [callback] - 완료 콜백
     */
    performChainAttack(attacker, targets, callback) {
        let currentIndex = 0;
        
        const attackNext = () => {
            if (currentIndex >= targets.length) {
                if (callback) callback();
                return;
            }
            
            const target = targets[currentIndex];
            currentIndex++;
            
            if (target.isAlive() && this.canAttack(attacker, target)) {
                this.performAttack(attacker, target, attackNext);
            } else {
                attackNext();
            }
        };
        
        attackNext();
    }
    
    /**
     * 반격 시스템
     * 
     * @param {Character} defender - 방어자
     * @param {Character} attacker - 원래 공격자
     * @returns {boolean} 반격 성공 여부
     */
    performCounterAttack(defender, attacker) {
        // 반격 조건 확인
        if (!defender.isAlive() || !attacker.isAlive()) return false;
        if (defender.hasAttacked) return false;
        
        // 반격 범위 확인 (근접 반격만 가능)
        const distance = defender.currentTile.distanceTo(attacker.currentTile);
        if (distance > 1) return false;
        
        // 반격 확률 (50%)
        if (Math.random() > 0.5) return false;
        
        // 반격 실행
        const damage = Math.floor(defender.attackPower * 0.7); // 반격은 70% 데미지
        attacker.takeDamage(damage);
        
        this.addCombatLog(
            `${defender.name}이(가) 반격! ${attacker.name}에게 ${damage}의 데미지!`
        );
        
        // 사망 체크
        if (!attacker.isAlive()) {
            this.handleCharacterDeath(attacker);
        }
        
        return true;
    }
    
    /**
     * 치명타 계산
     * 
     * @param {Character} attacker - 공격자
     * @returns {{isCritical: boolean, multiplier: number}} 치명타 정보
     */
    calculateCritical(attacker) {
        const criticalChance = 0.1; // 10% 치명타 확률
        const isCritical = Math.random() < criticalChance;
        const multiplier = isCritical ? 2 : 1;
        
        return { isCritical, multiplier };
    }
    
    /**
     * 회피 계산
     * 
     * @param {Character} target - 대상
     * @returns {boolean} 회피 성공 여부
     */
    calculateEvasion(target) {
        const evasionChance = 0.05; // 5% 회피 확률
        return Math.random() < evasionChance;
    }
    
    /**
     * 캐릭터 사망 처리
     * 
     * @param {Character} character - 사망한 캐릭터
     */
    handleCharacterDeath(character) {
        
        // 게임 상태에서 제거
        gameState.removeDeadCharacter(character);
        
        // 사망 콜백 실행
        if (this.onCharacterDeath) {
            this.onCharacterDeath(character);
        }
        
        // 게임 종료 체크
        this.checkGameEnd();
    }
    
    /**
     * 게임 종료 확인
     */
    checkGameEnd() {
        const alivePlayerCount = gameState.getAlivePlayerCount();
        const aliveEnemyCount = gameState.getAliveEnemyCount();
        
        if (alivePlayerCount === 0) {
            // 패배
            gameState.setGameState('player_lost');
            this.addCombatLog('패배! 모든 플레이어가 쓰러졌습니다.');
            
            if (this.onCombatEnd) {
                this.onCombatEnd('player_lost');
            }
        } else if (aliveEnemyCount === 0) {
            // 승리
            gameState.setGameState('player_won');
            this.addCombatLog('승리! 모든 적을 물리쳤습니다!');
            
            if (this.onCombatEnd) {
                this.onCombatEnd('player_won');
            }
        }
    }
    
    /**
     * 전투 로그 추가
     * 
     * @param {string} message - 로그 메시지
     */
    addCombatLog(message) {
        console.log(`[전투] ${message}`);
        
        if (this.onCombatLog) {
            this.onCombatLog(message);
        }
    }
    
    /**
     * 데미지 계산 (고급)
     * 
     * 방어력, 속성 등을 고려한 최종 데미지 계산
     * @param {Character} attacker - 공격자
     * @param {Character} target - 대상
     * @param {Object} options - 추가 옵션
     * @returns {number} 최종 데미지
     */
    calculateDamage(attacker, target, options = {}) {
        let damage = attacker.attackPower;
        
        // 치명타 적용
        const critical = this.calculateCritical(attacker);
        if (critical.isCritical) {
            damage *= critical.multiplier;
            this.addCombatLog('치명타!');
        }
        
        // 회피 체크
        if (this.calculateEvasion(target)) {
            this.addCombatLog(`${target.name}이(가) 공격을 회피했습니다!`);
            return 0;
        }
        
        // 방어력 적용 (추후 구현)
        // damage -= target.defense;
        
        // 속성 상성 적용 (추후 구현)
        // damage *= this.calculateElementalModifier(attacker.element, target.element);
        
        // 최소 데미지 보장
        damage = Math.max(1, Math.floor(damage));
        
        return damage;
    }
    
    /**
     * 전투 통계 반환
     * 
     * @returns {Object} 전투 통계
     */
    getCombatStats() {
        return {
            totalDamageDealt: 0, // 추후 구현
            totalDamageReceived: 0, // 추후 구현
            killCount: 0, // 추후 구현
            turnCount: gameState.turnCount,
        };
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const combatSystem = new CombatSystem();