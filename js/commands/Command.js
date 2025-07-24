/**
 * 커맨드 인터페이스
 * 
 * 모든 게임 액션을 실행/취소 가능한 커맨드로 캡슐화합니다.
 * 
 * @module Command
 */

/**
 * 추상 커맨드 클래스
 * 
 * @abstract
 * @class Command
 */
export class Command {
    /**
     * @param {string} type - 커맨드 타입
     * @param {Object} data - 커맨드 데이터
     */
    constructor(type, data = {}) {
        /**
         * 커맨드 타입
         * @type {string}
         */
        this.type = type;
        
        /**
         * 커맨드 데이터
         * @type {Object}
         */
        this.data = data;
        
        /**
         * 커맨드 ID (타임스탬프 기반)
         * @type {string}
         */
        this.id = `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        /**
         * 실행 시간
         * @type {number}
         */
        this.timestamp = Date.now();
        
        /**
         * 실행 여부
         * @type {boolean}
         */
        this.executed = false;
        
        /**
         * 실행 전 상태 스냅샷
         * @type {Object|null}
         */
        this.previousState = null;
    }
    
    /**
     * 커맨드 실행
     * 
     * @abstract
     * @returns {Promise<boolean>} 실행 성공 여부
     */
    async execute() {
        throw new Error('Command.execute() must be implemented by subclass');
    }
    
    /**
     * 커맨드 실행 취소
     * 
     * @abstract
     * @returns {Promise<boolean>} 취소 성공 여부
     */
    async undo() {
        throw new Error('Command.undo() must be implemented by subclass');
    }
    
    /**
     * 커맨드 재실행
     * 
     * @returns {Promise<boolean>} 재실행 성공 여부
     */
    async redo() {
        return this.execute();
    }
    
    /**
     * 커맨드 직렬화
     * 
     * @returns {Object} 직렬화된 커맨드 데이터
     */
    serialize() {
        return {
            id: this.id,
            type: this.type,
            data: this.data,
            timestamp: this.timestamp,
            executed: this.executed
        };
    }
    
    /**
     * 커맨드 역직렬화
     * 
     * @static
     * @param {Object} data - 직렬화된 데이터
     * @returns {Command} 커맨드 인스턴스
     */
    static deserialize(data) {
        // 서브클래스에서 구현
        throw new Error('Command.deserialize() must be implemented by subclass');
    }
}

/**
 * 커맨드 타입 열거형
 * 
 * @enum {string}
 */
export const CommandType = {
    MOVE: 'move',
    ATTACK: 'attack',
    END_TURN: 'end_turn',
    USE_SKILL: 'use_skill',
    GAME_START: 'game_start',
    GAME_END: 'game_end'
};