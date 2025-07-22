/**
 * AI 시스템
 * 
 * 적 캐릭터의 인공지능을 담당합니다.
 * 행동 결정, 타겟 선택, 경로 찾기 등을 수행합니다.
 * 
 * @module aiSystem
 */

import { gameState } from '../core/gameState.js';
import { gridSystem } from './gridSystem.js';
import { movementSystem } from './movementSystem.js';
import { combatSystem } from './combatSystem.js';
import { CHARACTER_TYPE } from '../core/constants.js';

/**
 * AI 시스템 클래스
 * 
 * @class AISystem
 */
export class AISystem {
    constructor() {
        /**
         * AI 난이도 레벨 (0-10)
         * @type {number}
         */
        this.difficultyLevel = 5;
        
        /**
         * AI 행동 딜레이 (밀리초)
         * @type {number}
         */
        this.actionDelay = 1000;
        
        /**
         * 현재 실행 중인 AI 여부
         * @type {boolean}
         */
        this.isProcessing = false;
    }
    
    /**
     * 적 턴 실행
     * 
     * 모든 적 캐릭터의 행동을 순차적으로 실행합니다.
     * @param {Function} [callback] - 턴 종료 콜백
     */
    executeEnemyTurn(callback) {
        if (this.isProcessing) {
            console.log('AI가 이미 실행 중입니다');
            return;
        }
        
        this.isProcessing = true;
        console.log('적 턴 시작');
        
        // 살아있는 적 캐릭터 목록
        const aliveEnemies = gameState.enemyCharacters.filter(enemy => enemy.isAlive());
        
        if (aliveEnemies.length === 0) {
            this.isProcessing = false;
            if (callback) callback();
            return;
        }
        
        // 순차적으로 적 행동 실행
        this.processEnemyActions(aliveEnemies, 0, () => {
            console.log('적 턴 종료');
            this.isProcessing = false;
            if (callback) callback();
        });
    }
    
    /**
     * 적 캐릭터들의 행동을 순차적으로 처리
     * 
     * @param {Character[]} enemies - 적 캐릭터 배열
     * @param {number} index - 현재 처리 중인 인덱스
     * @param {Function} callback - 완료 콜백
     */
    processEnemyActions(enemies, index, callback) {
        if (index >= enemies.length) {
            callback();
            return;
        }
        
        const enemy = enemies[index];
        
        // 딜레이 후 행동 실행
        setTimeout(() => {
            this.executeEnemyAction(enemy, () => {
                // 다음 적 처리
                this.processEnemyActions(enemies, index + 1, callback);
            });
        }, this.actionDelay);
    }
    
    /**
     * 개별 적 캐릭터의 행동 실행
     * 
     * @param {Character} enemy - 적 캐릭터
     * @param {Function} callback - 완료 콜백
     */
    executeEnemyAction(enemy, callback) {
        // 최적의 행동 결정
        const action = this.determineAction(enemy);
        
        switch (action.type) {
            case 'attack':
                this.performAttack(enemy, action.target, callback);
                break;
                
            case 'move':
                this.performMove(enemy, action.targetTile, callback);
                break;
                
            case 'move_and_attack':
                this.performMoveAndAttack(enemy, action.moveTile, action.attackTarget, callback);
                break;
                
            case 'wait':
            default:
                console.log(`${enemy.name}이(가) 대기합니다`);
                callback();
                break;
        }
    }
    
    /**
     * 최적의 행동 결정
     * 
     * @param {Character} enemy - 적 캐릭터
     * @returns {Object} 행동 정보 {type, target, targetTile}
     */
    determineAction(enemy) {
        // 공격 가능한 대상 찾기
        const attackableTargets = this.findAttackableTargets(enemy);
        
        if (attackableTargets.length > 0) {
            // 즉시 공격 가능
            const target = this.selectBestTarget(attackableTargets);
            return { type: 'attack', target };
        }
        
        // 이동 후 공격 가능한지 확인
        const moveAndAttackOptions = this.findMoveAndAttackOptions(enemy);
        
        if (moveAndAttackOptions.length > 0) {
            // 최적의 이동-공격 옵션 선택
            const bestOption = this.selectBestMoveAndAttackOption(moveAndAttackOptions);
            return {
                type: 'move_and_attack',
                moveTile: bestOption.tile,
                attackTarget: bestOption.target
            };
        }
        
        // 가장 가까운 적에게 접근
        const nearestTarget = this.findNearestTarget(enemy);
        if (nearestTarget) {
            const moveTile = this.findBestApproachTile(enemy, nearestTarget);
            if (moveTile) {
                return { type: 'move', targetTile: moveTile };
            }
        }
        
        // 행동할 수 없으면 대기
        return { type: 'wait' };
    }
    
    /**
     * 공격 가능한 대상 찾기
     * 
     * @param {Character} enemy - 적 캐릭터
     * @returns {Character[]} 공격 가능한 대상 목록
     */
    findAttackableTargets(enemy) {
        const targets = [];
        const attackableTiles = gridSystem.getAttackableTiles(enemy);
        
        attackableTiles.forEach(tile => {
            if (tile.occupant && tile.occupant.type === CHARACTER_TYPE.PLAYER) {
                targets.push(tile.occupant);
            }
        });
        
        return targets;
    }
    
    /**
     * 이동 후 공격 가능한 옵션 찾기
     * 
     * @param {Character} enemy - 적 캐릭터
     * @returns {Object[]} 이동-공격 옵션 목록
     */
    findMoveAndAttackOptions(enemy) {
        const options = [];
        const movableTiles = gridSystem.getMovableTiles(enemy);
        
        movableTiles.forEach(tile => {
            // 해당 타일에서 공격 가능한 대상 확인
            const attackableFromTile = [];
            const tilesInAttackRange = gridSystem.getTilesInRange(tile, enemy.attackRange);
            
            tilesInAttackRange.forEach(attackTile => {
                if (attackTile.occupant && attackTile.occupant.type === CHARACTER_TYPE.PLAYER) {
                    attackableFromTile.push(attackTile.occupant);
                }
            });
            
            if (attackableFromTile.length > 0) {
                attackableFromTile.forEach(target => {
                    options.push({ tile, target });
                });
            }
        });
        
        return options;
    }
    
    /**
     * 가장 가까운 적 찾기
     * 
     * @param {Character} enemy - 적 캐릭터
     * @returns {Character|null} 가장 가까운 플레이어 캐릭터
     */
    findNearestTarget(enemy) {
        let nearestTarget = null;
        let shortestDistance = Infinity;
        
        gameState.playerCharacters.forEach(player => {
            if (player.isAlive()) {
                const distance = enemy.currentTile.distanceTo(player.currentTile);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestTarget = player;
                }
            }
        });
        
        return nearestTarget;
    }
    
    /**
     * 최적의 공격 대상 선택
     * 
     * @param {Character[]} targets - 공격 가능한 대상 목록
     * @returns {Character} 선택된 대상
     */
    selectBestTarget(targets) {
        // 우선순위: 체력이 낮은 적 > 가까운 적
        return targets.reduce((best, current) => {
            // 체력 비율 계산
            const bestHealthRatio = best.health / best.maxHealth;
            const currentHealthRatio = current.health / current.maxHealth;
            
            // 체력이 20% 이상 차이나면 체력이 낮은 쪽 우선
            if (Math.abs(bestHealthRatio - currentHealthRatio) > 0.2) {
                return currentHealthRatio < bestHealthRatio ? current : best;
            }
            
            // 비슷한 체력이면 더 가까운 쪽
            const bestDistance = best.currentTile.distanceTo(current.currentTile);
            const currentDistance = current.currentTile.distanceTo(current.currentTile);
            
            return currentDistance < bestDistance ? current : best;
        });
    }
    
    /**
     * 최적의 이동-공격 옵션 선택
     * 
     * @param {Object[]} options - 이동-공격 옵션 목록
     * @returns {Object} 선택된 옵션
     */
    selectBestMoveAndAttackOption(options) {
        // 점수 계산: 낮은 체력 대상 + 짧은 이동 거리
        return options.reduce((best, current) => {
            const bestScore = this.calculateActionScore(best);
            const currentScore = this.calculateActionScore(current);
            
            return currentScore > bestScore ? current : best;
        });
    }
    
    /**
     * 행동 점수 계산
     * 
     * @param {Object} option - 이동-공격 옵션
     * @returns {number} 점수 (높을수록 좋음)
     */
    calculateActionScore(option) {
        let score = 0;
        
        // 대상 체력이 낮을수록 높은 점수
        const healthRatio = option.target.health / option.target.maxHealth;
        score += (1 - healthRatio) * 100;
        
        // 이동 거리가 짧을수록 높은 점수
        const moveDistance = option.tile.distanceTo(option.target.currentTile);
        score += (10 - moveDistance) * 10;
        
        // 난이도에 따른 보정
        score *= (this.difficultyLevel / 10);
        
        return score;
    }
    
    /**
     * 접근을 위한 최적 타일 찾기
     * 
     * @param {Character} enemy - 적 캐릭터
     * @param {Character} target - 목표 캐릭터
     * @returns {HexTile|null} 이동할 타일
     */
    findBestApproachTile(enemy, target) {
        const movableTiles = gridSystem.getMovableTiles(enemy);
        if (movableTiles.length === 0) return null;
        
        // 목표에 가장 가까운 타일 선택
        let bestTile = null;
        let shortestDistance = Infinity;
        
        movableTiles.forEach(tile => {
            const distance = tile.distanceTo(target.currentTile);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                bestTile = tile;
            }
        });
        
        return bestTile;
    }
    
    /**
     * 공격 실행
     * 
     * @param {Character} enemy - 적 캐릭터
     * @param {Character} target - 공격 대상
     * @param {Function} callback - 완료 콜백
     */
    performAttack(enemy, target, callback) {
        console.log(`${enemy.name}이(가) ${target.name}을(를) 공격합니다`);
        combatSystem.performAttack(enemy, target, callback);
    }
    
    /**
     * 이동 실행
     * 
     * @param {Character} enemy - 적 캐릭터
     * @param {HexTile} targetTile - 이동할 타일
     * @param {Function} callback - 완료 콜백
     */
    performMove(enemy, targetTile, callback) {
        console.log(`${enemy.name}이(가) 이동합니다`);
        movementSystem.moveCharacter(enemy, targetTile, callback);
    }
    
    /**
     * 이동 후 공격 실행
     * 
     * @param {Character} enemy - 적 캐릭터
     * @param {HexTile} moveTile - 이동할 타일
     * @param {Character} attackTarget - 공격 대상
     * @param {Function} callback - 완료 콜백
     */
    performMoveAndAttack(enemy, moveTile, attackTarget, callback) {
        // 먼저 이동
        this.performMove(enemy, moveTile, () => {
            // 이동 후 공격
            this.performAttack(enemy, attackTarget, callback);
        });
    }
    
    /**
     * AI 난이도 설정
     * 
     * @param {number} level - 난이도 레벨 (0-10)
     */
    setDifficulty(level) {
        this.difficultyLevel = Math.max(0, Math.min(10, level));
        console.log(`AI 난이도 설정: ${this.difficultyLevel}`);
        
        // 난이도에 따른 행동 딜레이 조정
        this.actionDelay = 2000 - (this.difficultyLevel * 150);
    }
    
    /**
     * 특수 AI 행동 패턴
     */
    
    /**
     * 방어적 행동 패턴
     * 
     * @param {Character} enemy - 적 캐릭터
     * @returns {Object} 행동 정보
     */
    defensiveBehavior(enemy) {
        // 체력이 30% 이하면 후퇴
        if (enemy.health / enemy.maxHealth < 0.3) {
            const retreatTile = this.findRetreatTile(enemy);
            if (retreatTile) {
                return { type: 'move', targetTile: retreatTile };
            }
        }
        
        return this.determineAction(enemy);
    }
    
    /**
     * 후퇴할 타일 찾기
     * 
     * @param {Character} enemy - 적 캐릭터
     * @returns {HexTile|null} 후퇴할 타일
     */
    findRetreatTile(enemy) {
        const movableTiles = gridSystem.getMovableTiles(enemy);
        const threats = gameState.playerCharacters.filter(p => p.isAlive());
        
        // 모든 위협으로부터 가장 먼 타일 선택
        let bestTile = null;
        let maxTotalDistance = 0;
        
        movableTiles.forEach(tile => {
            const totalDistance = threats.reduce((sum, threat) => {
                return sum + tile.distanceTo(threat.currentTile);
            }, 0);
            
            if (totalDistance > maxTotalDistance) {
                maxTotalDistance = totalDistance;
                bestTile = tile;
            }
        });
        
        return bestTile;
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const aiSystem = new AISystem();