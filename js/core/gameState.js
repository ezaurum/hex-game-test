/**
 * 게임 상태 관리 모듈
 * 
 * 게임의 전역 상태를 관리하는 모듈입니다.
 * 턴 관리, 선택 상태, 게임 진행 상태 등을 추적합니다.
 * 
 * @module gameState
 * @tutorial https://gameprogrammingpatterns.com/state.html
 */

import { GAME_STATE, TURN_TYPE } from './constants.js';
import { eventBus, GameEvents } from './eventBus.js';

/**
 * 게임 상태 클래스
 * 싱글톤 패턴으로 구현되어 전역에서 하나의 인스턴스만 존재합니다.
 * 
 * @class GameState
 * @tutorial https://refactoring.guru/design-patterns/singleton
 */
class GameState {
    constructor() {
        /**
         * 현재 게임 상태
         * @type {string}
         */
        this.currentState = GAME_STATE.PLAYING;
        
        /**
         * 현재 턴
         * @type {string}
         */
        this.currentTurn = TURN_TYPE.PLAYER;
        
        /**
         * 현재 선택된 캐릭터
         * @type {Character|null}
         */
        this.selectedCharacter = null;
        
        /**
         * 공격 모드 활성화 여부
         * @type {boolean}
         */
        this.isAttackMode = false;
        
        /**
         * 턴 카운터
         * @type {number}
         */
        this.turnCount = 1;
        
        /**
         * 플레이어 캐릭터 목록
         * @type {Character[]}
         */
        this.playerCharacters = [];
        
        /**
         * 적 캐릭터 목록
         * @type {Character[]}
         */
        this.enemyCharacters = [];
        
        /**
         * 모든 캐릭터 목록
         * @type {Character[]}
         */
        this.allCharacters = [];
        
        /**
         * 육각형 그리드
         * @type {HexTile[][]}
         */
        this.hexGrid = [];
        
        /**
         * 게임 설정 옵션
         * @type {Object}
         */
        this.settings = {
            soundEnabled: true,
            showFPS: true,
            autoEndTurn: false,
        };
    }
    
    /**
     * 캐릭터 선택
     * @param {Character} character - 선택할 캐릭터
     */
    selectCharacter(character) {
        // 이전 선택 해제
        if (this.selectedCharacter) {
            this.selectedCharacter.setSelected(false);
        }
        
        this.selectedCharacter = character;
        if (character) {
            character.setSelected(true);
        }
        
        // 공격 모드 초기화
        this.isAttackMode = false;
        
        // 선택 변경 이벤트 발생
        eventBus.emit(GameEvents.SELECTION_CHANGED, { character });
    }
    
    /**
     * 선택 해제
     */
    clearSelection() {
        if (this.selectedCharacter) {
            this.selectedCharacter.setSelected(false);
        }
        this.selectedCharacter = null;
        this.isAttackMode = false;
        
        // 선택 해제 이벤트 발생
        eventBus.emit(GameEvents.SELECTION_CHANGED, { character: null });
    }
    
    /**
     * 공격 모드 토글
     */
    toggleAttackMode() {
        this.isAttackMode = !this.isAttackMode;
    }
    
    /**
     * 턴 종료 및 다음 턴으로 전환
     * @returns {string} 다음 턴 타입
     */
    endTurn() {
        // 현재 턴의 모든 캐릭터 행동 완료 처리
        const currentCharacters = this.currentTurn === TURN_TYPE.PLAYER 
            ? this.playerCharacters 
            : this.enemyCharacters;
            
        currentCharacters.forEach(char => {
            if (char.isAlive()) {
                char.resetTurn();
            }
        });
        
        // 턴 전환
        this.currentTurn = this.currentTurn === TURN_TYPE.PLAYER 
            ? TURN_TYPE.ENEMY 
            : TURN_TYPE.PLAYER;
        
        // 플레이어 턴이 시작되면 턴 카운터 증가
        if (this.currentTurn === TURN_TYPE.PLAYER) {
            this.turnCount++;
        }
        
        // 선택 상태 초기화
        this.clearSelection();
        
        // 턴 변경 이벤트 발생
        eventBus.emit(GameEvents.TURN_CHANGED, {
            turn: this.currentTurn,
            turnCount: this.turnCount
        });
        
        return this.currentTurn;
    }
    
    /**
     * 게임 상태 변경
     * @param {string} newState - 새로운 게임 상태
     */
    setGameState(newState) {
        if (Object.values(GAME_STATE).includes(newState)) {
            this.currentState = newState;
        } else {
            console.error(`유효하지 않은 게임 상태: ${newState}`);
        }
    }
    
    /**
     * 게임이 진행 중인지 확인
     * @returns {boolean}
     */
    isPlaying() {
        return this.currentState === GAME_STATE.PLAYING;
    }
    
    /**
     * 플레이어 턴인지 확인
     * @returns {boolean}
     */
    isPlayerTurn() {
        return this.currentTurn === TURN_TYPE.PLAYER;
    }
    
    /**
     * 캐릭터 추가
     * @param {Character} character - 추가할 캐릭터
     */
    addCharacter(character) {
        this.allCharacters.push(character);
        
        if (character.type === 'player') {
            this.playerCharacters.push(character);
        } else {
            this.enemyCharacters.push(character);
        }
    }
    
    /**
     * 죽은 캐릭터 제거
     * @param {Character} character - 제거할 캐릭터
     */
    removeDeadCharacter(character) {
        // 전체 목록에서 제거
        const allIndex = this.allCharacters.indexOf(character);
        if (allIndex > -1) {
            this.allCharacters.splice(allIndex, 1);
        }
        
        // 타입별 목록에서 제거
        const list = character.type === 'player' 
            ? this.playerCharacters 
            : this.enemyCharacters;
        const index = list.indexOf(character);
        if (index > -1) {
            list.splice(index, 1);
        }
        
        // 선택 해제
        if (this.selectedCharacter === character) {
            this.clearSelection();
        }
    }
    
    /**
     * 살아있는 플레이어 수 확인
     * @returns {number}
     */
    getAlivePlayerCount() {
        return this.playerCharacters.filter(char => char.isAlive()).length;
    }
    
    /**
     * 살아있는 적 수 확인
     * @returns {number}
     */
    getAliveEnemyCount() {
        return this.enemyCharacters.filter(char => char.isAlive()).length;
    }
    
    /**
     * 모든 플레이어가 행동을 완료했는지 확인
     * @returns {boolean}
     */
    checkAllPlayersActed() {
        // 살아있는 플레이어들이 모두 행동을 완료했는지 확인
        const alivePlayerCharacters = this.playerCharacters.filter(char => char.isAlive());
        
        return alivePlayerCharacters.every(char => {
            // 캐릭터가 더 이상 행동할 수 없는 경우를 확인
            
            // 1. 모든 행동을 사용했는지 확인
            const hasUsedAllMoves = char.actionsUsed.move >= char.actionsPerTurn.move || 
                                   char.movedDistance >= char.movementRange;
            const hasUsedAllAttacks = char.actionsUsed.attack >= char.actionsPerTurn.attack;
            
            // 2. 이동과 공격 모두 사용했거나 사용할 수 없으면 행동 완료
            if (hasUsedAllMoves && hasUsedAllAttacks) {
                return true;
            }
            
            // 3. 이동을 모두 사용했고, 공격할 수 있는 적이 없으면 행동 완료
            if (hasUsedAllMoves && !this.canAttackAnyEnemy(char)) {
                return true;
            }
            
            return false;
        });
    }
    
    /**
     * 캐릭터가 공격할 수 있는 적이 있는지 확인
     * @param {Character} character - 확인할 캐릭터
     * @returns {boolean}
     */
    canAttackAnyEnemy(character) {
        // 이미 공격했으면 false
        if (character.hasAttacked) return false;
        
        // 적 캐릭터들 중 공격 가능한 대상이 있는지 확인
        const enemies = this.enemyCharacters.filter(enemy => enemy.isAlive());
        
        for (const enemy of enemies) {
            const distance = character.currentTile.distanceTo(enemy.currentTile);
            if (distance <= character.attackRange) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 게임 상태 초기화
     */
    reset() {
        this.currentState = GAME_STATE.PLAYING;
        this.currentTurn = TURN_TYPE.PLAYER;
        this.selectedCharacter = null;
        this.isAttackMode = false;
        this.turnCount = 1;
        this.playerCharacters = [];
        this.enemyCharacters = [];
        this.allCharacters = [];
        this.hexGrid = [];
    }
    
    /**
     * 현재 게임 상태 정보 반환
     * @returns {Object} 게임 상태 정보
     */
    getStateInfo() {
        return {
            state: this.currentState,
            turn: this.currentTurn,
            turnCount: this.turnCount,
            selectedCharacter: this.selectedCharacter?.id || null,
            isAttackMode: this.isAttackMode,
            alivePlayerCount: this.getAlivePlayerCount(),
            aliveEnemyCount: this.getAliveEnemyCount(),
        };
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const gameState = new GameState();