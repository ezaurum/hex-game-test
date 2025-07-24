/**
 * 턴 컨트롤 UI
 * 
 * 턴 종료 버튼을 제공하는 UI 컴포넌트입니다.
 * 
 * @module turnControl
 */

import { gameState } from '../core/gameState.js';
import { inputHandler } from '../controls/inputHandler.js';
import { eventBus, GameEvents } from '../core/eventBus.js';
import { TURN_TYPE } from '../core/constants.js';

/**
 * 턴 컨트롤 클래스
 * 
 * @class TurnControl
 */
class TurnControl {
    constructor() {
        /**
         * UI 컨테이너 엘리먼트
         * @type {HTMLElement}
         */
        this.container = null;
        
        /**
         * UI 엘리먼트들
         * @type {Object}
         */
        this.elements = {};
        
        /**
         * 표시 여부
         * @type {boolean}
         */
        this.visible = true;
    }
    
    /**
     * 초기화
     */
    init() {
        this.createUI();
        this.attachEventListeners();
        this.subscribeToEvents();
        this.updateButtons();
    }
    
    /**
     * UI 생성
     */
    createUI() {
        // 컨테이너 생성
        this.container = document.createElement('div');
        this.container.id = 'turn-control';
        this.container.className = 'turn-control-container';
        this.container.innerHTML = `
            <div class="turn-control-header">
                <h3>턴 컨트롤</h3>
            </div>
            <div class="turn-control-content">
                <div class="turn-info">
                    <span id="current-turn">플레이어 턴</span>
                    <span id="turn-count">턴 1</span>
                </div>
                <div class="turn-buttons">
                    <button id="end-character-turn" class="turn-btn" title="현재 캐릭터의 모든 행동을 종료합니다">
                        <span>👤</span> 캐릭터 턴 종료
                    </button>
                    <button id="end-player-turn" class="turn-btn" title="모든 플레이어의 턴을 종료하고 적 턴으로 넘어갑니다">
                        <span>⏭️</span> 전체 턴 종료
                    </button>
                </div>
            </div>
        `;
        
        // DOM에 추가
        document.body.appendChild(this.container);
        
        // 엘리먼트 참조 저장
        this.elements = {
            currentTurn: this.container.querySelector('#current-turn'),
            turnCount: this.container.querySelector('#turn-count'),
            endCharacterTurn: this.container.querySelector('#end-character-turn'),
            endPlayerTurn: this.container.querySelector('#end-player-turn')
        };
    }
    
    /**
     * 이벤트 리스너 연결
     */
    attachEventListeners() {
        // 캐릭터 턴 종료 버튼
        this.elements.endCharacterTurn.addEventListener('click', () => {
            this.endCharacterTurn();
        });
        
        // 전체 턴 종료 버튼
        this.elements.endPlayerTurn.addEventListener('click', () => {
            this.endPlayerTurn();
        });
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (!this.visible || !gameState.isPlayerTurn()) return;
            
            // Space: 현재 캐릭터 턴 종료
            if (e.key === ' ' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.endCharacterTurn();
            }
            
            // Enter: 전체 턴 종료
            if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.endPlayerTurn();
            }
        });
    }
    
    /**
     * 이벤트 구독
     */
    subscribeToEvents() {
        // 선택 변경 이벤트
        eventBus.on(GameEvents.SELECTION_CHANGED, () => {
            this.updateButtons();
        });
        
        // 캐릭터 행동 이벤트
        eventBus.on(GameEvents.CHARACTER_MOVED, () => {
            this.updateButtons();
        });
        
        eventBus.on(GameEvents.CHARACTER_ATTACKED, () => {
            this.updateButtons();
        });
        
        // 턴 변경 이벤트
        eventBus.on(GameEvents.TURN_CHANGED, () => {
            this.updateTurnInfo();
            this.updateButtons();
        });
    }
    
    /**
     * 현재 캐릭터의 턴 종료
     */
    endCharacterTurn() {
        const selectedCharacter = gameState.selectedCharacter;
        if (!selectedCharacter || selectedCharacter.type !== 'player') return;
        
        // 캐릭터의 모든 행동을 사용한 것으로 표시
        selectedCharacter.hasMoved = true;
        selectedCharacter.hasAttacked = true;
        selectedCharacter.movedDistance = selectedCharacter.movementRange;
        selectedCharacter.actionsUsed.move = selectedCharacter.actionsPerTurn.move;
        selectedCharacter.actionsUsed.attack = selectedCharacter.actionsPerTurn.attack;
        
        // 행동 상태 시각화 업데이트
        selectedCharacter.updateActionVisual();
        
        // 선택 해제
        gameState.clearSelection();
        
        // 이벤트 발생
        eventBus.emit(GameEvents.CHARACTER_TURN_ENDED, { character: selectedCharacter });
        
        // 버튼 상태 업데이트
        this.updateButtons();
        
        // 모든 플레이어가 행동을 완료했는지 확인
        if (gameState.checkAllPlayersActed()) {
            setTimeout(() => {
                inputHandler.endPlayerTurn();
            }, 500);
        }
    }
    
    /**
     * 플레이어 턴 종료
     */
    endPlayerTurn() {
        if (!gameState.isPlayerTurn()) return;
        
        // 모든 플레이어 캐릭터의 행동을 종료 상태로 설정
        gameState.playerCharacters.forEach(character => {
            if (character.isAlive()) {
                character.hasMoved = true;
                character.hasAttacked = true;
                character.movedDistance = character.movementRange;
                character.actionsUsed.move = character.actionsPerTurn.move;
                character.actionsUsed.attack = character.actionsPerTurn.attack;
                
                // 행동 상태 시각화 업데이트
                character.updateActionVisual();
            }
        });
        
        // 턴 종료
        inputHandler.endPlayerTurn();
    }
    
    /**
     * 버튼 상태 업데이트
     */
    updateButtons() {
        const isPlayerTurn = gameState.isPlayerTurn();
        const selectedCharacter = gameState.selectedCharacter;
        
        // 플레이어 턴이 아니면 모든 버튼 비활성화
        if (!isPlayerTurn) {
            this.elements.endCharacterTurn.disabled = true;
            this.elements.endPlayerTurn.disabled = true;
            return;
        }
        
        // 캐릭터 턴 종료 버튼
        if (selectedCharacter && selectedCharacter.type === 'player' && selectedCharacter.isAlive()) {
            const hasActions = !selectedCharacter.hasMoved || !selectedCharacter.hasAttacked;
            this.elements.endCharacterTurn.disabled = !hasActions;
        } else {
            this.elements.endCharacterTurn.disabled = true;
        }
        
        // 전체 턴 종료 버튼은 플레이어 턴이면 항상 활성화
        this.elements.endPlayerTurn.disabled = false;
    }
    
    /**
     * 턴 정보 업데이트
     */
    updateTurnInfo() {
        const turnText = gameState.currentTurn === TURN_TYPE.PLAYER ? '플레이어 턴' : '적 턴';
        const turnNumber = Math.ceil(gameState.turnCount / 2);
        
        this.elements.currentTurn.textContent = turnText;
        this.elements.turnCount.textContent = `턴 ${turnNumber}`;
        
        // 적 턴일 때 스타일 변경
        if (gameState.currentTurn === TURN_TYPE.ENEMY) {
            this.container.classList.add('enemy-turn');
        } else {
            this.container.classList.remove('enemy-turn');
        }
    }
    
    /**
     * 표시
     */
    show() {
        this.container.style.display = 'block';
        this.visible = true;
        this.updateButtons();
        this.updateTurnInfo();
    }
    
    /**
     * 숨기기
     */
    hide() {
        this.container.style.display = 'none';
        this.visible = false;
    }
    
    /**
     * UI 제거
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
        this.elements = {};
        this.visible = false;
    }
}

// 싱글톤 인스턴스
export const turnControl = new TurnControl();

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .turn-control-container {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 280px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #444;
        border-radius: 8px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
        transition: all 0.3s ease;
    }
    
    .turn-control-container.enemy-turn {
        border-color: #f44336;
    }
    
    .turn-control-header {
        padding: 10px 15px;
        border-bottom: 1px solid #444;
    }
    
    .turn-control-header h3 {
        margin: 0;
        font-size: 16px;
        text-align: center;
    }
    
    .turn-control-content {
        padding: 15px;
    }
    
    .turn-info {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15px;
        font-size: 14px;
        color: #aaa;
    }
    
    #current-turn {
        font-weight: bold;
        color: #4CAF50;
    }
    
    .enemy-turn #current-turn {
        color: #f44336;
    }
    
    .turn-buttons {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .turn-btn {
        padding: 10px 15px;
        border: 1px solid #555;
        background: #333;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.3s ease;
    }
    
    .turn-btn:hover:not(:disabled) {
        background: #444;
        border-color: #666;
        transform: translateY(-1px);
    }
    
    .turn-btn:active:not(:disabled) {
        transform: translateY(0);
    }
    
    .turn-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .turn-btn span {
        font-size: 18px;
    }
    
    /* 호버 시 툴팁 스타일 */
    .turn-btn[title]:hover::after {
        content: attr(title);
        position: absolute;
        bottom: -35px;
        left: 50%;
        transform: translateX(-50%);
        padding: 5px 10px;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid #666;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1001;
        pointer-events: none;
    }
`;
document.head.appendChild(style);