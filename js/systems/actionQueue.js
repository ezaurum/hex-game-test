/**
 * 액션 큐 시스템
 * 
 * 게임 로직과 애니메이션을 분리하여 관리합니다.
 * 모든 게임 액션(이동, 공격 등)은 먼저 즉시 실행되고,
 * 애니메이션은 별도로 큐에 저장되어 순차적으로 재생됩니다.
 * 
 * @module actionQueue
 */

/**
 * 액션 타입 열거형
 * @enum {string}
 */
export const ActionType = {
    MOVE: 'move',
    ATTACK: 'attack',
    SKILL: 'skill',
    DAMAGE: 'damage',
    DEATH: 'death',
    BUFF: 'buff',
    TURN_START: 'turn_start',
    TURN_END: 'turn_end'
};

/**
 * 액션 큐 클래스
 * 
 * @class ActionQueue
 */
class ActionQueue {
    constructor() {
        /**
         * 액션 큐
         * @type {Array<Object>}
         */
        this.queue = [];
        
        /**
         * 현재 실행 중인 액션
         * @type {Object|null}
         */
        this.currentAction = null;
        
        /**
         * 실행 중 여부
         * @type {boolean}
         */
        this.isProcessing = false;
        
        /**
         * 일시정지 여부
         * @type {boolean}
         */
        this.isPaused = false;
        
        /**
         * 액션 완료 콜백
         * @type {Function|null}
         */
        this.onActionComplete = null;
        
        /**
         * 큐 비움 콜백
         * @type {Function|null}
         */
        this.onQueueEmpty = null;
        
        /**
         * 액션별 핸들러
         * @type {Map<string, Function>}
         */
        this.handlers = new Map();
    }
    
    /**
     * 액션 추가
     * 
     * @param {string} type - 액션 타입
     * @param {Object} data - 액션 데이터
     * @param {Object} options - 추가 옵션
     */
    enqueue(type, data, options = {}) {
        const action = {
            id: `action_${Date.now()}_${Math.random()}`,
            type,
            data,
            options,
            timestamp: Date.now()
        };
        
        this.queue.push(action);
        // 자동 실행 (이미 처리 중이 아닌 경우)
        if (!this.isProcessing && !this.isPaused) {
            this.processNext();
        }
        
        return action.id;
    }
    
    /**
     * 이동 액션 추가
     * 
     * @param {Character} character - 캐릭터
     * @param {Array<HexTile>} path - 이동 경로
     * @param {Object} options - 옵션
     */
    enqueueMove(character, path, options = {}) {
        return this.enqueue(ActionType.MOVE, {
            character,
            path,
            startTile: character.currentTile,
            endTile: path[path.length - 1]
        }, options);
    }
    
    /**
     * 공격 액션 추가
     * 
     * @param {Character} attacker - 공격자
     * @param {Character} target - 대상
     * @param {number} damage - 데미지
     * @param {Object} options - 옵션
     */
    enqueueAttack(attacker, target, damage, options = {}) {
        return this.enqueue(ActionType.ATTACK, {
            attacker,
            target,
            damage,
            attackerPos: { ...attacker.group.position },
            targetPos: { ...target.group.position }
        }, options);
    }
    
    /**
     * 데미지 액션 추가
     * 
     * @param {Character} target - 대상
     * @param {number} damage - 데미지
     * @param {Object} options - 옵션
     */
    enqueueDamage(target, damage, options = {}) {
        return this.enqueue(ActionType.DAMAGE, {
            target,
            damage,
            oldHealth: target.health,
            newHealth: Math.max(0, target.health - damage)
        }, options);
    }
    
    /**
     * 사망 액션 추가
     * 
     * @param {Character} character - 캐릭터
     * @param {Object} options - 옵션
     */
    enqueueDeath(character, options = {}) {
        return this.enqueue(ActionType.DEATH, {
            character
        }, options);
    }
    
    /**
     * 다음 액션 처리
     */
    async processNext() {
        if (this.isPaused || this.isProcessing || this.queue.length === 0) {
            if (this.queue.length === 0 && this.onQueueEmpty) {
                this.onQueueEmpty();
            }
            return;
        }
        
        this.isProcessing = true;
        this.currentAction = this.queue.shift();
        try {
            // 액션 타입별 핸들러 실행
            const handler = this.handlers.get(this.currentAction.type);
            if (handler) {
                await handler(this.currentAction.data, this.currentAction.options);
            }
            
            // 완료 콜백
            if (this.onActionComplete) {
                this.onActionComplete(this.currentAction);
            }
        } catch (error) {
            console.error('Action processing error:', error);
        }
        
        this.currentAction = null;
        this.isProcessing = false;
        
        // 다음 액션 처리
        if (!this.isPaused && this.queue.length > 0) {
            this.processNext();
        }
    }
    
    /**
     * 핸들러 등록
     * 
     * @param {string} type - 액션 타입
     * @param {Function} handler - 핸들러 함수
     */
    registerHandler(type, handler) {
        this.handlers.set(type, handler);
    }
    
    /**
     * 일시정지
     */
    pause() {
        this.isPaused = true;
    }
    
    /**
     * 재개
     */
    resume() {
        this.isPaused = false;
        if (!this.isProcessing && this.queue.length > 0) {
            this.processNext();
        }
    }
    
    /**
     * 큐 비우기
     */
    clear() {
        this.queue = [];
        this.currentAction = null;
    }
    
    /**
     * 현재 액션 건너뛰기
     */
    skipCurrent() {
        if (this.currentAction) {
            // 애니메이션 컨트롤러에 스킵 신호 전송
            const skipEvent = new CustomEvent('actionSkip', {
                detail: { action: this.currentAction }
            });
            window.dispatchEvent(skipEvent);
        }
    }
    
    /**
     * 모든 액션 건너뛰기
     */
    skipAll() {
        this.clear();
        this.skipCurrent();
    }
    
    /**
     * 큐 상태 반환
     * 
     * @returns {Object} 큐 상태
     */
    getStatus() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            isPaused: this.isPaused,
            currentAction: this.currentAction
        };
    }
    
    /**
     * 액션 우선순위 설정
     * 
     * @param {string} actionId - 액션 ID
     * @param {boolean} priority - 우선 실행 여부
     */
    setPriority(actionId, priority) {
        const index = this.queue.findIndex(action => action.id === actionId);
        if (index > -1 && priority) {
            const action = this.queue.splice(index, 1)[0];
            this.queue.unshift(action);
        }
    }
}

// 싱글톤 인스턴스
export const actionQueue = new ActionQueue();