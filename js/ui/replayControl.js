/**
 * 리플레이 컨트롤 UI
 * 
 * 전투 리플레이를 제어하는 UI 컴포넌트입니다.
 * 
 * @module replayControl
 */

import { commandHistory } from '../managers/commandHistory.js';
import { eventBus, GameEvents } from '../core/eventBus.js';

/**
 * 리플레이 컨트롤 클래스
 * 
 * @class ReplayControl
 */
class ReplayControl {
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
        this.visible = false;
    }
    
    /**
     * 초기화
     */
    init() {
        this.createUI();
        this.attachEventListeners();
        this.subscribeToEvents();
    }
    
    /**
     * UI 생성
     */
    createUI() {
        // 리플레이 열기 버튼 생성
        this.createOpenButton();
        // 컨테이너 생성
        this.container = document.createElement('div');
        this.container.id = 'replay-control';
        this.container.className = 'replay-control-container';
        this.container.innerHTML = `
            <div class="replay-header">
                <h3>리플레이 컨트롤</h3>
                <button class="close-btn">×</button>
            </div>
            <div class="replay-content">
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
                    <button id="replay-all-btn" class="action-btn">
                        <span>▶</span> 전체 리플레이
                    </button>
                    <button id="stop-replay-btn" class="action-btn" disabled>
                        <span>■</span> 중지
                    </button>
                </div>
                <div class="replay-speed">
                    <label>재생 속도:</label>
                    <input type="range" id="replay-speed" min="100" max="3000" value="1000" step="100">
                    <span id="speed-value">1.0초</span>
                </div>
                <div class="replay-hotkeys">
                    <div class="hotkey-info">키보드 단축키:</div>
                    <div class="hotkey-item">R - 리플레이 컨트롤 열기/닫기</div>
                    <div class="hotkey-item">Ctrl+Z - 실행 취소</div>
                    <div class="hotkey-item">Ctrl+Y - 재실행</div>
                </div>
            </div>
        `;
        
        // DOM에 추가
        document.body.appendChild(this.container);
        
        // 엘리먼트 참조 저장
        this.elements = {
            closeBtn: this.container.querySelector('.close-btn'),
            historyLength: this.container.querySelector('#history-length'),
            currentIndex: this.container.querySelector('#current-index'),
            commandStatus: this.container.querySelector('#command-status'),
            undoBtn: this.container.querySelector('#undo-btn'),
            redoBtn: this.container.querySelector('#redo-btn'),
            replayAllBtn: this.container.querySelector('#replay-all-btn'),
            stopReplayBtn: this.container.querySelector('#stop-replay-btn'),
            replaySpeed: this.container.querySelector('#replay-speed'),
            speedValue: this.container.querySelector('#speed-value')
        };
        
        // 초기 스타일
        this.hide();
    }
    
    /**
     * 이벤트 리스너 연결
     */
    attachEventListeners() {
        // 닫기 버튼
        this.elements.closeBtn.addEventListener('click', () => this.hide());
        
        // 실행 취소/재실행
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.redoBtn.addEventListener('click', () => this.redo());
        
        // 리플레이 컨트롤
        this.elements.replayAllBtn.addEventListener('click', () => this.startReplay());
        this.elements.stopReplayBtn.addEventListener('click', () => this.stopReplay());
        
        // 속도 조절
        this.elements.replaySpeed.addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            commandHistory.replaySpeed = speed;
            this.elements.speedValue.textContent = `${speed / 1000}초`;
        });
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            // R 키로 리플레이 토글 (visible 상태와 관계없이)
            if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.toggle();
                return;
            }
            
            // 나머지는 visible일 때만
            if (!this.visible) return;
            
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.undo();
                } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });
    }
    
    /**
     * 이벤트 구독
     */
    subscribeToEvents() {
        // 커맨드 실행/취소/재실행 이벤트
        eventBus.on('command:executed', (data) => {
            this.updateUI();
            this.showCommandStatus(`실행: ${data.command.type}`, 'executed');
        });
        eventBus.on('command:undone', (data) => {
            this.updateUI();
            this.showCommandStatus(`취소: ${data.command.type}`, 'undone');
        });
        eventBus.on('command:redone', (data) => {
            this.updateUI();
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
            this.updateUI();
        });
    }
    
    /**
     * UI 업데이트
     */
    updateUI() {
        const status = commandHistory.getStatus();
        
        // 히스토리 정보 업데이트
        this.elements.historyLength.textContent = status.historyLength;
        this.elements.currentIndex.textContent = status.currentIndex + 1;
        
        // 버튼 상태 업데이트
        this.elements.undoBtn.disabled = !status.canUndo || status.isReplayMode;
        this.elements.redoBtn.disabled = !status.canRedo || status.isReplayMode;
        this.elements.replayAllBtn.disabled = status.historyLength === 0 || status.isReplayMode;
    }
    
    /**
     * 실행 취소
     */
    async undo() {
        await commandHistory.undo();
    }
    
    /**
     * 재실행
     */
    async redo() {
        await commandHistory.redo();
    }
    
    /**
     * 리플레이 시작
     */
    async startReplay() {
        // 처음부터 리플레이
        await commandHistory.startReplay(0);
    }
    
    /**
     * 리플레이 중지
     */
    stopReplay() {
        commandHistory.stopReplayMode();
    }
    
    /**
     * 리플레이 열기 버튼 생성
     */
    createOpenButton() {
        this.openButton = document.createElement('button');
        this.openButton.id = 'replay-open-btn';
        this.openButton.className = 'replay-open-button';
        this.openButton.innerHTML = '🔄 리플레이';
        this.openButton.title = '리플레이 컨트롤 열기 (R)';
        
        this.openButton.addEventListener('click', () => this.show());
        
        document.body.appendChild(this.openButton);
    }
    
    /**
     * 표시
     */
    show() {
        this.container.style.display = 'block';
        this.visible = true;
        this.openButton.style.display = 'none';
        this.updateUI();
    }
    
    /**
     * 숨기기
     */
    hide() {
        this.container.style.display = 'none';
        this.visible = false;
        this.openButton.style.display = 'block';
    }
    
    /**
     * 토글
     */
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    /**
     * 커맨드 상태 표시
     * @param {string} message - 표시할 메시지
     * @param {string} type - 타입 (executed, undone, redone)
     */
    showCommandStatus(message, type) {
        this.elements.commandStatus.textContent = message;
        this.elements.commandStatus.className = `command-status ${type}`;
        
        // 2초 후 사라지게
        setTimeout(() => {
            this.elements.commandStatus.textContent = '';
            this.elements.commandStatus.className = 'command-status';
        }, 2000);
    }
    
    /**
     * UI 제거
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.openButton && this.openButton.parentNode) {
            this.openButton.parentNode.removeChild(this.openButton);
        }
        this.container = null;
        this.openButton = null;
        this.elements = {};
        this.visible = false;
    }
}

// 싱글톤 인스턴스
export const replayControl = new ReplayControl();

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .replay-control-container {
        position: fixed;
        bottom: 370px;
        right: 20px;
        width: 320px;
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid #444;
        border-radius: 8px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
    }
    
    .replay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        border-bottom: 1px solid #444;
    }
    
    .replay-header h3 {
        margin: 0;
        font-size: 16px;
    }
    
    .close-btn {
        background: none;
        border: none;
        color: #aaa;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .close-btn:hover {
        color: white;
    }
    
    .replay-content {
        padding: 15px;
    }
    
    .replay-info {
        margin-bottom: 15px;
        text-align: center;
        color: #aaa;
        font-size: 14px;
    }
    
    .replay-controls,
    .replay-actions {
        display: flex;
        gap: 10px;
        margin-bottom: 15px;
    }
    
    .control-btn,
    .action-btn {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #555;
        background: #333;
        color: white;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
    }
    
    .control-btn:hover:not(:disabled),
    .action-btn:hover:not(:disabled) {
        background: #444;
        border-color: #666;
    }
    
    .control-btn:disabled,
    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    .replay-speed {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
    }
    
    .replay-speed label {
        white-space: nowrap;
    }
    
    .replay-speed input[type="range"] {
        flex: 1;
    }
    
    .replay-speed #speed-value {
        min-width: 50px;
        text-align: right;
    }
    
    .replay-open-button {
        position: fixed;
        bottom: 370px;
        right: 20px;
        padding: 10px 20px;
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #444;
        border-radius: 8px;
        color: white;
        font-family: Arial, sans-serif;
        font-size: 14px;
        cursor: pointer;
        z-index: 999;
        transition: all 0.3s ease;
    }
    
    .replay-open-button:hover {
        background: rgba(0, 0, 0, 0.9);
        border-color: #666;
        transform: scale(1.05);
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
    
    .replay-hotkeys {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #444;
        font-size: 12px;
        color: #888;
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