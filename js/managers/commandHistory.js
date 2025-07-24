/**
 * 커맨드 히스토리 매니저
 * 
 * 실행된 커맨드를 관리하고 실행 취소/재실행 기능을 제공합니다.
 * 
 * @module commandHistory
 */

import { eventBus, GameEvents } from '../core/eventBus.js';

/**
 * 커맨드 히스토리 클래스
 * 
 * @class CommandHistory
 */
class CommandHistory {
    constructor() {
        /**
         * 커맨드 히스토리 스택
         * @type {Array<Command>}
         */
        this.history = [];
        
        /**
         * 현재 위치 인덱스
         * @type {number}
         */
        this.currentIndex = -1;
        
        /**
         * 최대 히스토리 크기
         * @type {number}
         */
        this.maxHistorySize = 1000;
        
        /**
         * 리플레이 모드 여부
         * @type {boolean}
         */
        this.isReplayMode = false;
        
        /**
         * 리플레이 속도 (밀리초)
         * @type {number}
         */
        this.replaySpeed = 1000;
        
        /**
         * 리플레이 중단 플래그
         * @type {boolean}
         */
        this.stopReplay = false;
    }
    
    /**
     * 커맨드 실행 및 히스토리 추가
     * 
     * @param {Command} command - 실행할 커맨드
     * @returns {Promise<boolean>} 실행 성공 여부
     */
    async execute(command) {
        try {
            const success = await command.execute();
            
            if (success) {
                // 현재 위치 이후의 히스토리 삭제 (새로운 분기 생성)
                if (this.currentIndex < this.history.length - 1) {
                    this.history = this.history.slice(0, this.currentIndex + 1);
                }
                
                // 히스토리에 추가
                this.history.push(command);
                this.currentIndex++;
                
                // 최대 크기 초과 시 오래된 항목 제거
                if (this.history.length > this.maxHistorySize) {
                    this.history.shift();
                    this.currentIndex--;
                }
                
                // 이벤트 발생
                eventBus.emit('command:executed', { command });
            }
            
            return success;
        } catch (error) {
            console.error('Command execution failed:', error);
            return false;
        }
    }
    
    /**
     * 실행 취소
     * 
     * @returns {Promise<boolean>} 취소 성공 여부
     */
    async undo() {
        if (!this.canUndo()) return false;
        
        try {
            const command = this.history[this.currentIndex];
            const success = await command.undo();
            
            if (success) {
                this.currentIndex--;
                eventBus.emit('command:undone', { command });
            }
            
            return success;
        } catch (error) {
            console.error('Command undo failed:', error);
            return false;
        }
    }
    
    /**
     * 재실행
     * 
     * @returns {Promise<boolean>} 재실행 성공 여부
     */
    async redo() {
        if (!this.canRedo()) return false;
        
        try {
            this.currentIndex++;
            const command = this.history[this.currentIndex];
            const success = await command.redo();
            
            if (success) {
                eventBus.emit('command:redone', { command });
            } else {
                this.currentIndex--;
            }
            
            return success;
        } catch (error) {
            console.error('Command redo failed:', error);
            this.currentIndex--;
            return false;
        }
    }
    
    /**
     * 특정 위치로 이동
     * 
     * @param {number} targetIndex - 목표 인덱스
     * @returns {Promise<boolean>} 이동 성공 여부
     */
    async goTo(targetIndex) {
        if (targetIndex < -1 || targetIndex >= this.history.length) {
            return false;
        }
        
        // 뒤로 가기
        while (this.currentIndex > targetIndex) {
            if (!await this.undo()) return false;
        }
        
        // 앞으로 가기
        while (this.currentIndex < targetIndex) {
            if (!await this.redo()) return false;
        }
        
        return true;
    }
    
    /**
     * 리플레이 시작
     * 
     * @param {number} [fromIndex=0] - 시작 인덱스
     * @param {number} [toIndex] - 종료 인덱스 (기본: 마지막)
     * @returns {Promise<void>}
     */
    async startReplay(fromIndex = 0, toIndex = null) {
        if (this.isReplayMode) return;
        
        this.isReplayMode = true;
        this.stopReplay = false;
        toIndex = toIndex ?? this.history.length - 1;
        
        // 시작 위치로 이동
        await this.goTo(fromIndex - 1);
        
        // 리플레이 시작 이벤트
        eventBus.emit('replay:started', { fromIndex, toIndex });
        
        // 순차적으로 실행
        for (let i = fromIndex; i <= toIndex && !this.stopReplay; i++) {
            await this.redo();
            
            // 대기
            await new Promise(resolve => setTimeout(resolve, this.replaySpeed));
        }
        
        this.isReplayMode = false;
        eventBus.emit('replay:ended');
    }
    
    /**
     * 리플레이 중단
     */
    stopReplayMode() {
        this.stopReplay = true;
    }
    
    /**
     * 실행 취소 가능 여부
     * 
     * @returns {boolean}
     */
    canUndo() {
        return this.currentIndex >= 0;
    }
    
    /**
     * 재실행 가능 여부
     * 
     * @returns {boolean}
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }
    
    /**
     * 히스토리 초기화
     */
    clear() {
        this.history = [];
        this.currentIndex = -1;
    }
    
    /**
     * 히스토리 저장
     * 
     * @returns {Object} 직렬화된 히스토리
     */
    save() {
        return {
            history: this.history.map(cmd => cmd.serialize()),
            currentIndex: this.currentIndex,
            timestamp: Date.now()
        };
    }
    
    /**
     * 히스토리 불러오기
     * 
     * @param {Object} data - 저장된 히스토리 데이터
     */
    load(data) {
        // 구현 필요: 직렬화된 데이터로부터 커맨드 복원
        console.warn('History loading not yet implemented');
    }
    
    /**
     * 현재 상태 정보
     * 
     * @returns {Object}
     */
    getStatus() {
        return {
            historyLength: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            isReplayMode: this.isReplayMode
        };
    }
}

// 싱글톤 인스턴스
export const commandHistory = new CommandHistory();