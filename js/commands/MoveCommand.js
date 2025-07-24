/**
 * 이동 커맨드
 * 
 * 캐릭터의 이동 액션을 캡슐화합니다.
 * 
 * @module MoveCommand
 */

import { Command, CommandType } from './Command.js';
import { battleManager } from '../managers/battleManager.js';

/**
 * 이동 커맨드 클래스
 * 
 * @class MoveCommand
 * @extends Command
 */
export class MoveCommand extends Command {
    /**
     * @param {Object} data - 이동 데이터
     * @param {Character} data.character - 이동할 캐릭터
     * @param {HexTile} data.fromTile - 시작 타일
     * @param {HexTile} data.toTile - 도착 타일
     * @param {Array<HexTile>} data.path - 이동 경로
     */
    constructor(data) {
        super(CommandType.MOVE, data);
        
        // 상태 저장
        this.previousState = {
            characterId: data.character.id,
            fromTileCoords: { q: data.fromTile.q, r: data.fromTile.r },
            hasMoved: data.character.hasMoved,
            movedDistance: data.character.movedDistance,
            actionsUsed: { ...data.character.actionsUsed }
        };
    }
    
    /**
     * 이동 실행
     * 
     * @returns {Promise<boolean>} 실행 성공 여부
     */
    async execute() {
        const { character, toTile, path } = this.data;
        
        // battleManager의 executeMove를 통해 실제 이동 처리
        const success = battleManager.executeMove(character, path);
        
        if (success) {
            this.executed = true;
        }
        
        return success;
    }
    
    /**
     * 이동 취소
     * 
     * @returns {Promise<boolean>} 취소 성공 여부
     */
    async undo() {
        if (!this.executed) return false;
        
        const { character, fromTile } = this.data;
        
        // 이전 위치로 복원
        if (character.currentTile) {
            character.currentTile.removeOccupant();
        }
        
        character.currentTile = fromTile;
        fromTile.setOccupant(character);
        
        // 위치 즉시 업데이트
        const pos = fromTile.getPixelPosition();
        character.setPosition(pos.x, pos.z);
        
        // 상태 복원
        character.hasMoved = this.previousState.hasMoved;
        character.movedDistance = this.previousState.movedDistance;
        character.actionsUsed = { ...this.previousState.actionsUsed };
        
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
            characterId: this.data.character.id,
            fromTile: { q: this.data.fromTile.q, r: this.data.fromTile.r },
            toTile: { q: this.data.toTile.q, r: this.data.toTile.r },
            path: this.data.path.map(tile => ({ q: tile.q, r: tile.r }))
        };
    }
}