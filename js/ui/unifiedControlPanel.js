/**
 * 통합 컨트롤 패널
 * 
 * 애니메이션 컨트롤, 리플레이, 턴 컨트롤, 컴뱃 로그를 하나의 창에 통합합니다.
 * 
 * @module unifiedControlPanel
 */

import { gameState } from '../core/gameState.js';
import { inputHandler } from '../controls/inputHandler.js';
import { commandHistory } from '../managers/commandHistory.js';
import { battleManager } from '../managers/battleManager.js';
import { eventBus, GameEvents } from '../core/eventBus.js';
import { TURN_TYPE } from '../core/constants.js';

/**
 * 통합 컨트롤 패널 클래스
 * 
 * @class UnifiedControlPanel
 */
class UnifiedControlPanel {
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
        
        /**
         * 현재 활성 탭
         * @type {string}
         */
        this.activeTab = 'combat';
        
        /**
         * 로그 메시지 목록
         * @type {Array}
         */
        this.logMessages = [];
        
        /**
         * 최대 로그 수
         * @type {number}
         */
        this.maxLogs = 100;
    }
    
    /**
     * 초기화
     */
    init() {
        this.createUI();
        this.attachEventListeners();
        this.subscribeToEvents();
        this.updateAll();
    }
    
    /**
     * UI 생성
     */
    createUI() {
        // 컨테이너 생성
        this.container = document.createElement('div');
        this.container.id = 'unified-control-panel';
        this.container.className = 'unified-control-panel';
        this.container.innerHTML = `
            <div class="panel-header">
                <div class="panel-title">게임 컨트롤</div>
                <div class="panel-tabs">
                    <button class="tab-btn active" data-tab="combat">전투</button>
                    <button class="tab-btn" data-tab="turn">턴</button>
                    <button class="tab-btn" data-tab="animation">애니메이션</button>
                    <button class="tab-btn" data-tab="replay">리플레이</button>
                </div>
                <button class="minimize-btn">_</button>
            </div>
            <div class="panel-content">
                <!-- 전투 로그 탭 -->
                <div class="tab-content active" data-tab="combat">
                    <div class="combat-log-container">
                        <div class="log-header">전투 로그</div>
                        <div class="log-messages" id="log-messages"></div>
                        <div class="log-controls">
                            <button id="clear-logs">로그 지우기</button>
                            <label>
                                <input type="checkbox" id="auto-scroll" checked> 자동 스크롤
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- 턴 컨트롤 탭 -->
                <div class="tab-content" data-tab="turn">
                    <div class="turn-info">
                        <div class="turn-status">
                            <span id="current-turn">플레이어 턴</span>
                            <span id="turn-count">턴 1</span>
                        </div>
                    </div>
                    <div class="turn-buttons">
                        <button id="end-character-turn" class="control-btn" title="현재 캐릭터의 모든 행동을 종료합니다">
                            <span>👤</span> 캐릭터 턴 종료
                        </button>
                        <button id="end-player-turn" class="control-btn" title="모든 플레이어의 턴을 종료하고 적 턴으로 넘어갑니다">
                            <span>⏭️</span> 전체 턴 종료
                        </button>
                    </div>
                </div>
                
                <!-- 애니메이션 컨트롤 탭 -->
                <div class="tab-content" data-tab="animation">
                    <div class="animation-controls">
                        <div class="speed-control">
                            <label>애니메이션 속도:</label>
                            <input type="range" id="animation-speed" min="0.1" max="3" value="1" step="0.1">
                            <span id="speed-display">1.0x</span>
                        </div>
                        <div class="animation-buttons">
                            <button id="pause-animations" class="control-btn">⏸️ 일시정지</button>
                            <button id="resume-animations" class="control-btn">▶️ 재개</button>
                            <button id="skip-current" class="control-btn">⏭️ 현재 스킵</button>
                            <button id="skip-all" class="control-btn">⏩ 모두 스킵</button>
                        </div>
                    </div>
                </div>
                
                <!-- 리플레이 컨트롤 탭 -->
                <div class="tab-content" data-tab="replay">
                    <div class="replay-info">
                        <span class="history-info">히스토리: <span id="history-length">0</span> / <span id="current-index">0</span></span>
                        <div id="command-status" class="command-status"></div>
                    </div>
                    <div class="replay-controls">
                        <button id="undo-btn" class="control-btn" disabled>
                            <span>↶</span> 실행 취소
                        </button>
                        <button id="redo-btn" class="control-btn" disabled>
                            <span>↷</span> 재실행
                        </button>
                    </div>
                    <div class="replay-actions">
                        <button id="replay-all-btn" class="control-btn">
                            <span>▶</span> 전체 리플레이
                        </button>
                        <button id="stop-replay-btn" class="control-btn" disabled>
                            <span>■</span> 중지
                        </button>
                    </div>
                    <div class="replay-speed">
                        <label>재생 속도:</label>
                        <input type="range" id="replay-speed" min="100" max="3000" value="1000" step="100">
                        <span id="replay-speed-value">1.0초</span>
                    </div>
                    <div class="replay-hotkeys">
                        <div class="hotkey-info">키보드 단축키:</div>
                        <div class="hotkey-item">Ctrl+Z - 실행 취소</div>
                        <div class="hotkey-item">Ctrl+Y - 재실행</div>
                        <div class="hotkey-item">Space - 캐릭터 턴 종료</div>
                        <div class="hotkey-item">Enter - 전체 턴 종료</div>
                    </div>
                </div>
            </div>
        `;
        
        // DOM에 추가
        document.body.appendChild(this.container);
        
        // 엘리먼트 참조 저장
        this.elements = {
            // 공통
            tabBtns: this.container.querySelectorAll('.tab-btn'),
            tabContents: this.container.querySelectorAll('.tab-content'),
            minimizeBtn: this.container.querySelector('.minimize-btn'),
            
            // 전투 로그
            logMessages: this.container.querySelector('#log-messages'),
            clearLogs: this.container.querySelector('#clear-logs'),
            autoScroll: this.container.querySelector('#auto-scroll'),
            
            // 턴 컨트롤
            currentTurn: this.container.querySelector('#current-turn'),
            turnCount: this.container.querySelector('#turn-count'),
            endCharacterTurn: this.container.querySelector('#end-character-turn'),
            endPlayerTurn: this.container.querySelector('#end-player-turn'),
            
            // 애니메이션 컨트롤
            animationSpeed: this.container.querySelector('#animation-speed'),
            speedDisplay: this.container.querySelector('#speed-display'),
            pauseAnimations: this.container.querySelector('#pause-animations'),
            resumeAnimations: this.container.querySelector('#resume-animations'),
            skipCurrent: this.container.querySelector('#skip-current'),
            skipAll: this.container.querySelector('#skip-all'),
            
            // 리플레이 컨트롤
            historyLength: this.container.querySelector('#history-length'),
            currentIndex: this.container.querySelector('#current-index'),
            commandStatus: this.container.querySelector('#command-status'),
            undoBtn: this.container.querySelector('#undo-btn'),
            redoBtn: this.container.querySelector('#redo-btn'),
            replayAllBtn: this.container.querySelector('#replay-all-btn'),
            stopReplayBtn: this.container.querySelector('#stop-replay-btn'),
            replaySpeed: this.container.querySelector('#replay-speed'),
            replaySpeedValue: this.container.querySelector('#replay-speed-value')
        };
    }
    
    /**
     * 이벤트 리스너 연결
     */
    attachEventListeners() {
        // 탭 전환
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 최소화/최대화
        this.elements.minimizeBtn.addEventListener('click', () => {
            this.toggleMinimize();
        });
        
        // 전투 로그 컨트롤
        this.elements.clearLogs.addEventListener('click', () => {
            this.clearLogs();
        });
        
        // 턴 컨트롤
        this.elements.endCharacterTurn.addEventListener('click', () => {
            this.endCharacterTurn();
        });
        
        this.elements.endPlayerTurn.addEventListener('click', () => {
            this.endPlayerTurn();
        });
        
        // 애니메이션 컨트롤
        this.elements.animationSpeed.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            battleManager.setAnimationSpeed(speed);
            this.elements.speedDisplay.textContent = `${speed.toFixed(1)}x`;
        });
        
        this.elements.pauseAnimations.addEventListener('click', () => {
            battleManager.pause();
        });
        
        this.elements.resumeAnimations.addEventListener('click', () => {
            battleManager.resume();
        });
        
        this.elements.skipCurrent.addEventListener('click', () => {
            battleManager.skipCurrent();
        });
        
        this.elements.skipAll.addEventListener('click', () => {
            battleManager.skipAll();
        });
        
        // 리플레이 컨트롤
        this.elements.undoBtn.addEventListener('click', () => {
            commandHistory.undo();
        });
        
        this.elements.redoBtn.addEventListener('click', () => {
            commandHistory.redo();
        });
        
        this.elements.replayAllBtn.addEventListener('click', () => {
            commandHistory.startReplay(0);
        });
        
        this.elements.stopReplayBtn.addEventListener('click', () => {
            commandHistory.stopReplayMode();
        });
        
        this.elements.replaySpeed.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            commandHistory.replaySpeed = speed;
            this.elements.replaySpeedValue.textContent = `${speed / 1000}초`;
        });
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    commandHistory.undo();
                } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                    e.preventDefault();
                    commandHistory.redo();
                }
            }
            
            if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                if (e.key === ' ') {
                    e.preventDefault();
                    this.endCharacterTurn();
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    this.endPlayerTurn();
                }
            }
        });
    }
    
    /**
     * 이벤트 구독
     */
    subscribeToEvents() {
        // 턴 변경
        eventBus.on(GameEvents.TURN_CHANGED, () => {
            this.updateTurnInfo();
            this.updateTurnButtons();
        });
        
        // 선택 변경
        eventBus.on(GameEvents.SELECTION_CHANGED, () => {
            this.updateTurnButtons();
        });
        
        // 캐릭터 행동
        eventBus.on(GameEvents.CHARACTER_MOVED, () => {
            this.updateTurnButtons();
        });
        
        eventBus.on(GameEvents.CHARACTER_ATTACKED, () => {
            this.updateTurnButtons();
        });
        
        // 커맨드 이벤트
        eventBus.on('command:executed', (data) => {
            this.updateReplayInfo();
            this.showCommandStatus(`실행: ${data.command.type}`, 'executed');
        });
        
        eventBus.on('command:undone', (data) => {
            this.updateReplayInfo();
            this.showCommandStatus(`취소: ${data.command.type}`, 'undone');
        });
        
        eventBus.on('command:redone', (data) => {
            this.updateReplayInfo();
            this.showCommandStatus(`재실행: ${data.command.type}`, 'redone');
        });
        
        // 리플레이 이벤트
        eventBus.on('replay:started', () => {
            this.elements.replayAllBtn.disabled = true;
            this.elements.stopReplayBtn.disabled = false;
            this.elements.undoBtn.disabled = true;
            this.elements.redoBtn.disabled = true;
        });
        
        eventBus.on('replay:ended', () => {
            this.elements.replayAllBtn.disabled = false;
            this.elements.stopReplayBtn.disabled = true;
            this.updateReplayInfo();
        });
    }
    
    /**
     * 탭 전환
     */
    switchTab(tabName) {
        // 탭 버튼 업데이트
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // 탭 콘텐츠 업데이트
        this.elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.dataset.tab === tabName);
        });
        
        this.activeTab = tabName;
    }
    
    /**
     * 최소화/최대화 토글
     */
    toggleMinimize() {
        this.container.classList.toggle('minimized');
        this.elements.minimizeBtn.textContent = 
            this.container.classList.contains('minimized') ? '□' : '_';
    }
    
    /**
     * 로그 메시지 추가
     */
    addLog(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = {
            message,
            type,
            timestamp,
            id: Date.now() + Math.random()
        };
        
        this.logMessages.push(logEntry);
        
        // 최대 로그 수 제한
        if (this.logMessages.length > this.maxLogs) {
            this.logMessages.shift();
        }
        
        this.updateLogDisplay();
    }
    
    /**
     * 로그 표시 업데이트
     */
    updateLogDisplay() {
        const container = this.elements.logMessages;
        container.innerHTML = '';
        
        this.logMessages.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry log-${log.type}`;
            logElement.innerHTML = `
                <span class="log-time">[${log.timestamp}]</span>
                <span class="log-message">${log.message}</span>
            `;
            container.appendChild(logElement);
        });
        
        // 자동 스크롤
        if (this.elements.autoScroll.checked) {
            container.scrollTop = container.scrollHeight;
        }
    }
    
    /**
     * 로그 지우기
     */
    clearLogs() {
        this.logMessages = [];
        this.updateLogDisplay();
    }
    
    /**
     * 현재 캐릭터 턴 종료
     */
    endCharacterTurn() {
        const selectedCharacter = gameState.selectedCharacter;
        if (!selectedCharacter || selectedCharacter.type !== 'player') return;
        
        selectedCharacter.hasMoved = true;
        selectedCharacter.hasAttacked = true;
        selectedCharacter.movedDistance = selectedCharacter.movementRange;
        selectedCharacter.actionsUsed.move = selectedCharacter.actionsPerTurn.move;
        selectedCharacter.actionsUsed.attack = selectedCharacter.actionsPerTurn.attack;
        
        selectedCharacter.updateActionVisual();
        gameState.clearSelection();
        
        this.addLog(`${selectedCharacter.name}의 턴이 종료되었습니다.`, 'turn');
        
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
        
        gameState.playerCharacters.forEach(character => {
            if (character.isAlive()) {
                character.hasMoved = true;
                character.hasAttacked = true;
                character.movedDistance = character.movementRange;
                character.actionsUsed.move = character.actionsPerTurn.move;
                character.actionsUsed.attack = character.actionsPerTurn.attack;
                character.updateActionVisual();
            }
        });
        
        this.addLog('플레이어 턴이 종료되었습니다.', 'turn');
        inputHandler.endPlayerTurn();
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
     * 턴 버튼 상태 업데이트
     */
    updateTurnButtons() {
        const isPlayerTurn = gameState.isPlayerTurn();
        const selectedCharacter = gameState.selectedCharacter;
        
        if (!isPlayerTurn) {
            this.elements.endCharacterTurn.disabled = true;
            this.elements.endPlayerTurn.disabled = true;
            return;
        }
        
        if (selectedCharacter && selectedCharacter.type === 'player' && selectedCharacter.isAlive()) {
            const hasActions = !selectedCharacter.hasMoved || !selectedCharacter.hasAttacked;
            this.elements.endCharacterTurn.disabled = !hasActions;
        } else {
            this.elements.endCharacterTurn.disabled = true;
        }
        
        this.elements.endPlayerTurn.disabled = false;
    }
    
    /**
     * 리플레이 정보 업데이트
     */
    updateReplayInfo() {
        const status = commandHistory.getStatus();
        
        this.elements.historyLength.textContent = status.historyLength;
        this.elements.currentIndex.textContent = status.currentIndex + 1;
        
        this.elements.undoBtn.disabled = !status.canUndo || status.isReplayMode;
        this.elements.redoBtn.disabled = !status.canRedo || status.isReplayMode;
        this.elements.replayAllBtn.disabled = status.historyLength === 0 || status.isReplayMode;
    }
    
    /**
     * 커맨드 상태 표시
     */
    showCommandStatus(message, type) {
        this.elements.commandStatus.textContent = message;
        this.elements.commandStatus.className = `command-status ${type}`;
        
        setTimeout(() => {
            this.elements.commandStatus.textContent = '';
            this.elements.commandStatus.className = 'command-status';
        }, 2000);
    }
    
    /**
     * 모든 UI 업데이트
     */
    updateAll() {
        this.updateTurnInfo();
        this.updateTurnButtons();
        this.updateReplayInfo();
    }
    
    /**
     * 표시
     */
    show() {
        this.container.style.display = 'block';
        this.visible = true;
        this.updateAll();
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
        this.logMessages = [];
    }
}

// 싱글톤 인스턴스
export const unifiedControlPanel = new UnifiedControlPanel();

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .unified-control-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 400px;
        background: rgba(0, 0, 0, 0.95);
        border: 2px solid #444;
        border-radius: 12px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
        transition: all 0.3s ease;
        backdrop-filter: blur(10px);
    }
    
    .unified-control-panel.enemy-turn {
        border-color: #f44336;
    }
    
    .unified-control-panel.minimized .panel-content {
        display: none;
    }
    
    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 15px;
        border-bottom: 1px solid #444;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px 10px 0 0;
    }
    
    .panel-title {
        font-size: 16px;
        font-weight: bold;
    }
    
    .panel-tabs {
        display: flex;
        gap: 5px;
    }
    
    .tab-btn {
        padding: 5px 10px;
        border: 1px solid #555;
        background: transparent;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.3s ease;
    }
    
    .tab-btn:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    
    .tab-btn.active {
        background: #007acc;
        border-color: #007acc;
    }
    
    .minimize-btn {
        background: none;
        border: none;
        color: #aaa;
        font-size: 18px;
        cursor: pointer;
        padding: 5px;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
    }
    
    .minimize-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: white;
    }
    
    .panel-content {
        max-height: 400px;
        overflow-y: auto;
    }
    
    .tab-content {
        display: none;
        padding: 15px;
    }
    
    .tab-content.active {
        display: block;
    }
    
    /* 전투 로그 스타일 */
    .combat-log-container {
        height: 300px;
        display: flex;
        flex-direction: column;
    }
    
    .log-header {
        font-weight: bold;
        margin-bottom: 10px;
        color: #007acc;
    }
    
    .log-messages {
        flex: 1;
        overflow-y: auto;
        border: 1px solid #555;
        border-radius: 4px;
        padding: 10px;
        background: rgba(0, 0, 0, 0.3);
        margin-bottom: 10px;
    }
    
    .log-entry {
        margin-bottom: 5px;
        padding: 3px 0;
        font-size: 13px;
        line-height: 1.4;
    }
    
    .log-time {
        color: #888;
        font-size: 11px;
        margin-right: 8px;
    }
    
    .log-entry.log-damage .log-message {
        color: #ff6b6b;
        font-weight: bold;
    }
    
    .log-entry.log-system .log-message {
        color: #ffd93d;
    }
    
    .log-entry.log-turn .log-message {
        color: #6bcf7f;
    }
    
    .log-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 12px;
    }
    
    .log-controls button {
        padding: 5px 10px;
        border: 1px solid #555;
        background: #333;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 11px;
    }
    
    .log-controls button:hover {
        background: #444;
    }
    
    /* 턴 컨트롤 스타일 */
    .turn-info {
        margin-bottom: 15px;
    }
    
    .turn-status {
        display: flex;
        justify-content: space-between;
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
    
    /* 공통 컨트롤 버튼 스타일 */
    .control-btn {
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
    
    .control-btn:hover:not(:disabled) {
        background: #444;
        border-color: #666;
        transform: translateY(-1px);
    }
    
    .control-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* 애니메이션 컨트롤 스타일 */
    .animation-controls {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    
    .speed-control {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
    }
    
    .speed-control input[type="range"] {
        flex: 1;
    }
    
    .animation-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
    }
    
    /* 리플레이 컨트롤 스타일 */
    .replay-info {
        margin-bottom: 15px;
        text-align: center;
        color: #aaa;
        font-size: 14px;
    }
    
    .command-status {
        margin-top: 5px;
        font-size: 12px;
        height: 16px;
        transition: opacity 0.3s ease;
    }
    
    .command-status.executed {
        color: #4CAF50;
    }
    
    .command-status.undone {
        color: #FF9800;
    }
    
    .command-status.redone {
        color: #2196F3;
    }
    
    .replay-controls,
    .replay-actions {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .replay-speed {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        margin-bottom: 15px;
    }
    
    .replay-speed input[type="range"] {
        flex: 1;
    }
    
    .replay-hotkeys {
        font-size: 12px;
        color: #888;
        border-top: 1px solid #444;
        padding-top: 15px;
    }
    
    .hotkey-info {
        margin-bottom: 5px;
        font-weight: bold;
        color: #aaa;
    }
    
    .hotkey-item {
        margin-left: 10px;
        line-height: 1.4;
    }
`;
document.head.appendChild(style);