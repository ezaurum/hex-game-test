/**
 * 전투 로그 UI
 * 
 * 전투 중 발생하는 이벤트를 화면에 표시하는 UI 컴포넌트입니다.
 * 
 * @module combatLog
 */

/**
 * 전투 로그 클래스
 * 
 * @class CombatLog
 */
export class CombatLog {
    constructor() {
        /**
         * 로그 컨테이너 DOM 요소
         * @type {HTMLElement}
         */
        this.container = null;
        
        /**
         * 로그 목록 DOM 요소
         * @type {HTMLElement}
         */
        this.logList = null;
        
        /**
         * 최대 로그 개수
         * @type {number}
         */
        this.maxLogs = 100;
        
        /**
         * 현재 로그 개수
         * @type {number}
         */
        this.logCount = 0;
        
        /**
         * 로그 자동 스크롤 여부
         * @type {boolean}
         */
        this.autoScroll = true;
        
        /**
         * 로그 타입별 색상
         * @type {Object}
         */
        this.logColors = {
            damage: '#ff6b6b',      // 데미지 (빨간색)
            heal: '#51cf66',        // 치유 (녹색)
            move: '#339af0',        // 이동 (파란색)
            turn: '#fab005',        // 턴 (노란색)
            system: '#868e96',      // 시스템 (회색)
            victory: '#51cf66',     // 승리 (녹색)
            defeat: '#ff6b6b',      // 패배 (빨간색)
        };
    }
    
    /**
     * 전투 로그 UI 초기화
     */
    init() {
        this.createUI();
        this.setupEventListeners();
        console.log('전투 로그 UI 초기화 완료');
    }
    
    /**
     * UI 요소 생성
     */
    createUI() {
        // 기존 컨테이너 찾기 또는 생성
        this.container = document.getElementById('combat-log');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'combat-log';
            this.container.className = 'combat-log-container';
            document.body.appendChild(this.container);
        }
        
        // 스타일 적용
        this.applyStyles();
        
        // 제목 생성
        const title = document.createElement('div');
        title.className = 'combat-log-title';
        title.textContent = '전투 로그';
        this.container.appendChild(title);
        
        // 로그 목록 생성
        this.logList = document.createElement('ul');
        this.logList.className = 'combat-log-list';
        this.container.appendChild(this.logList);
        
        // 초기 메시지
        this.addLog('전투 시작!', 'system');
    }
    
    /**
     * 스타일 적용
     */
    applyStyles() {
        // 스타일이 이미 추가되었는지 확인
        if (document.getElementById('combat-log-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'combat-log-styles';
        style.textContent = `
            .combat-log-container {
                position: fixed;
                top: 10px;
                right: 10px;
                width: 300px;
                max-height: 300px;
                background: rgba(0, 0, 0, 0.8);
                border: 1px solid #333;
                border-radius: 5px;
                color: white;
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 12px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                z-index: 1000;
                user-select: none;
            }
            
            .combat-log-title {
                padding: 10px;
                background: rgba(0, 0, 0, 0.9);
                border-bottom: 1px solid #333;
                font-weight: bold;
                text-align: center;
            }
            
            .combat-log-list {
                flex: 1;
                margin: 0;
                padding: 0;
                list-style: none;
                overflow-y: auto;
                overflow-x: hidden;
            }
            
            .combat-log-list::-webkit-scrollbar {
                width: 6px;
            }
            
            .combat-log-list::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
            }
            
            .combat-log-list::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
            }
            
            .combat-log-list::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
            
            .combat-log-item {
                padding: 5px 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                animation: fadeIn 0.3s ease-in;
            }
            
            .combat-log-item:last-child {
                border-bottom: none;
            }
            
            .combat-log-time {
                color: #868e96;
                font-size: 10px;
                margin-right: 5px;
            }
            
            .combat-log-message {
                display: inline;
                word-wrap: break-word;
            }
            
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateX(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            /* 모바일 대응 */
            @media (max-width: 768px) {
                .combat-log-container {
                    width: 250px;
                    max-height: 200px;
                    font-size: 11px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 로그 목록 스크롤 이벤트
        this.logList.addEventListener('scroll', () => {
            // 사용자가 수동으로 스크롤하면 자동 스크롤 비활성화
            const isAtBottom = Math.abs(
                this.logList.scrollHeight - this.logList.scrollTop - this.logList.clientHeight
            ) < 5;
            
            this.autoScroll = isAtBottom;
        });
        
        // 로그 클릭 시 자동 스크롤 토글
        this.container.addEventListener('dblclick', () => {
            this.autoScroll = !this.autoScroll;
            if (this.autoScroll) {
                this.scrollToBottom();
            }
        });
    }
    
    /**
     * 로그 추가
     * 
     * @param {string} message - 로그 메시지
     * @param {string} [type='system'] - 로그 타입
     */
    addLog(message, type = 'system') {
        // 로그 아이템 생성
        const logItem = document.createElement('li');
        logItem.className = 'combat-log-item';
        
        // 시간 표시
        const time = new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'combat-log-time';
        timeSpan.textContent = `[${time}]`;
        
        // 메시지
        const messageSpan = document.createElement('span');
        messageSpan.className = 'combat-log-message';
        messageSpan.textContent = message;
        
        // 타입별 색상 적용
        if (this.logColors[type]) {
            messageSpan.style.color = this.logColors[type];
        }
        
        // 로그 아이템 조립
        logItem.appendChild(timeSpan);
        logItem.appendChild(messageSpan);
        
        // 로그 목록에 추가
        this.logList.appendChild(logItem);
        this.logCount++;
        
        // 최대 로그 개수 초과 시 오래된 로그 제거
        if (this.logCount > this.maxLogs) {
            this.logList.removeChild(this.logList.firstChild);
            this.logCount--;
        }
        
        // 자동 스크롤
        if (this.autoScroll) {
            this.scrollToBottom();
        }
    }
    
    /**
     * 데미지 로그 추가 (특수 포맷)
     * 
     * @param {string} attackerName - 공격자 이름
     * @param {string} targetName - 대상 이름
     * @param {number} damage - 데미지
     * @param {boolean} [isCritical=false] - 치명타 여부
     */
    addDamageLog(attackerName, targetName, damage, isCritical = false) {
        const criticalText = isCritical ? ' (치명타!)' : '';
        const message = `${attackerName}이(가) ${targetName}에게 ${damage}의 데미지${criticalText}`;
        this.addLog(message, 'damage');
    }
    
    /**
     * 이동 로그 추가
     * 
     * @param {string} characterName - 캐릭터 이름
     * @param {string} [direction] - 이동 방향 (선택적)
     */
    addMoveLog(characterName, direction) {
        const directionText = direction ? ` ${direction}으로` : '';
        const message = `${characterName}이(가)${directionText} 이동`;
        this.addLog(message, 'move');
    }
    
    /**
     * 턴 로그 추가
     * 
     * @param {string} turnType - 턴 타입 (player/enemy)
     * @param {number} [turnNumber] - 턴 번호
     */
    addTurnLog(turnType, turnNumber) {
        const turnText = turnType === 'player' ? '플레이어' : '적';
        const numberText = turnNumber ? ` (턴 ${turnNumber})` : '';
        const message = `${turnText} 턴 시작${numberText}`;
        this.addLog(message, 'turn');
    }
    
    /**
     * 게임 종료 로그 추가
     * 
     * @param {boolean} isVictory - 승리 여부
     */
    addGameEndLog(isVictory) {
        const message = isVictory ? '승리!' : '패배...';
        const type = isVictory ? 'victory' : 'defeat';
        this.addLog(message, type);
    }
    
    /**
     * 맨 아래로 스크롤
     */
    scrollToBottom() {
        this.logList.scrollTop = this.logList.scrollHeight;
    }
    
    /**
     * 모든 로그 삭제
     */
    clearLogs() {
        this.logList.innerHTML = '';
        this.logCount = 0;
    }
    
    /**
     * UI 표시/숨기기
     * 
     * @param {boolean} visible
     */
    setVisible(visible) {
        this.container.style.display = visible ? 'flex' : 'none';
    }
    
    /**
     * UI 위치 변경
     * 
     * @param {string} position - 'top-left', 'top-right', 'bottom-left', 'bottom-right'
     */
    setPosition(position) {
        // 기존 위치 클래스 제거
        this.container.style.top = '';
        this.container.style.bottom = '';
        this.container.style.left = '';
        this.container.style.right = '';
        
        // 새 위치 적용
        switch (position) {
            case 'top-left':
                this.container.style.top = '10px';
                this.container.style.left = '10px';
                break;
            case 'top-right':
                this.container.style.top = '10px';
                this.container.style.right = '10px';
                break;
            case 'bottom-left':
                this.container.style.bottom = '10px';
                this.container.style.left = '10px';
                break;
            case 'bottom-right':
                this.container.style.bottom = '10px';
                this.container.style.right = '10px';
                break;
        }
    }
    
    /**
     * UI 제거
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        
        // 스타일 제거
        const style = document.getElementById('combat-log-styles');
        if (style && style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const combatLog = new CombatLog();