/**
 * 턴 종료 커맨드
 * 
 * 턴 종료 액션을 캡슐화합니다.
 * 
 * @module EndTurnCommand
 */

import { Command, CommandType } from './Command.js';
import { gameState } from '../core/gameState.js';

/**
 * 턴 종료 커맨드 클래스
 * 
 * @class EndTurnCommand
 * @extends Command
 */
export class EndTurnCommand extends Command {
    /**
     * @param {Object} data - 턴 종료 데이터
     * @param {string} data.previousTurn - 이전 턴 타입
     * @param {number} data.turnCount - 턴 카운트
     */
    constructor(data) {
        super(CommandType.END_TURN, data);
        
        // 상태 저장
        this.previousState = {
            turn: data.previousTurn,
            turnCount: data.turnCount,
            charactersState: this.saveCharactersState()
        };
    }
    
    /**
     * 모든 캐릭터의 상태 저장
     * 
     * @private
     * @returns {Array} 캐릭터 상태 배열
     */
    saveCharactersState() {
        const states = [];
        
        gameState.allCharacters.forEach(char => {
            states.push({
                id: char.id,
                hasMoved: char.hasMoved,
                hasAttacked: char.hasAttacked,
                movedDistance: char.movedDistance,
                actionsUsed: { ...char.actionsUsed }
            });
        });
        
        return states;
    }
    
    /**
     * 턴 종료 실행
     * 
     * @returns {Promise<boolean>} 실행 성공 여부
     */
    async execute() {
        // gameState의 endTurn 호출
        gameState.endTurn();
        
        this.data.nextTurn = gameState.currentTurn;
        this.executed = true;
        
        return true;
    }
    
    /**
     * 턴 종료 취소
     * 
     * @returns {Promise<boolean>} 취소 성공 여부
     */
    async undo() {
        if (!this.executed) return false;
        
        // 턴 상태 복원
        gameState.currentTurn = this.previousState.turn;
        gameState.turnCount = this.previousState.turnCount;
        
        // 캐릭터 상태 복원
        this.previousState.charactersState.forEach(state => {
            const char = gameState.allCharacters.find(c => c.id === state.id);
            if (char) {
                char.hasMoved = state.hasMoved;
                char.hasAttacked = state.hasAttacked;
                char.movedDistance = state.movedDistance;
                char.actionsUsed = { ...state.actionsUsed };
            }
        });
        
        this.executed = false;
        return true;
    }
    
    /**
     * 직렬화
     * 
     * @returns {Object} 직렬화된 데이터
     */
    serialize() {
        const base = super.serialize();
        return {
            ...base,
            previousTurn: this.data.previousTurn,
            nextTurn: this.data.nextTurn,
            turnCount: this.data.turnCount
        };
    }
}