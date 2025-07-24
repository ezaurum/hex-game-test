/**
 * 승리/패배 메시지 표시
 * 
 * 게임 종료 시 승리 또는 패배 메시지를 표시하는 UI 컴포넌트입니다.
 * 
 * @module victoryMessage
 */

/**
 * 승리 메시지 클래스
 * 
 * @class VictoryMessage
 */
class VictoryMessage {
    constructor() {
        /**
         * 메시지 엘리먼트
         * @type {HTMLElement}
         */
        this.element = null;
        
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
        this.createElement();
    }
    
    /**
     * 엘리먼트 생성
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.id = 'victory-message';
        this.element.className = 'victory-message-overlay';
        this.element.innerHTML = `
            <div class="victory-message-content">
                <div class="victory-icon"></div>
                <div class="victory-title"></div>
                <div class="victory-subtitle"></div>
                <div class="victory-buttons">
                    <button class="victory-btn primary" id="restart-btn">새 게임</button>
                    <button class="victory-btn secondary" id="close-btn">닫기</button>
                </div>
            </div>
        `;
        
        // DOM에 추가
        document.body.appendChild(this.element);
        
        // 초기에는 숨김
        this.hide();
        
        // 이벤트 리스너 연결
        this.attachEventListeners();
    }
    
    /**
     * 이벤트 리스너 연결
     */
    attachEventListeners() {
        const restartBtn = this.element.querySelector('#restart-btn');
        const closeBtn = this.element.querySelector('#close-btn');
        
        restartBtn.addEventListener('click', () => {
            this.onRestart();
        });
        
        closeBtn.addEventListener('click', () => {
            this.hide();
        });
        
        // 배경 클릭으로 닫기
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });
        
        // ESC 키로 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.visible) {
                this.hide();
            }
        });
    }
    
    /**
     * 승리 메시지 표시
     */
    showVictory() {
        const icon = this.element.querySelector('.victory-icon');
        const title = this.element.querySelector('.victory-title');
        const subtitle = this.element.querySelector('.victory-subtitle');
        
        icon.textContent = '🎉';
        icon.className = 'victory-icon victory';
        title.textContent = '승리!';
        title.className = 'victory-title victory';
        subtitle.textContent = '모든 적을 물리쳤습니다!';
        
        this.show();
        this.playVictorySound();
    }
    
    /**
     * 패배 메시지 표시
     */
    showDefeat() {
        const icon = this.element.querySelector('.victory-icon');
        const title = this.element.querySelector('.victory-title');
        const subtitle = this.element.querySelector('.victory-subtitle');
        
        icon.textContent = '💀';
        icon.className = 'victory-icon defeat';
        title.textContent = '패배...';
        title.className = 'victory-title defeat';
        subtitle.textContent = '모든 플레이어가 쓰러졌습니다.';
        
        this.show();
        this.playDefeatSound();
    }
    
    /**
     * 승리 효과음 재생
     */
    playVictorySound() {
        // 간단한 승리 효과음 (웹 오디오 API 사용)
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 승리 멜로디 (도-미-솔-도)
            const notes = [261.63, 329.63, 392.00, 523.25];
            const duration = 0.3;
            
            notes.forEach((frequency, index) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
                
                const startTime = audioContext.currentTime + index * 0.2;
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            });
        } catch (error) {
            console.log('승리 효과음 재생 실패:', error);
        }
    }
    
    /**
     * 패배 효과음 재생
     */
    playDefeatSound() {
        // 간단한 패배 효과음
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 패배 사운드 (낮은 음)
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(75, audioContext.currentTime + 1);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 1);
        } catch (error) {
            console.log('패배 효과음 재생 실패:', error);
        }
    }
    
    /**
     * 재시작 콜백
     */
    onRestart() {
        this.hide();
        // 게임 재시작 (main.js의 game 인스턴스 접근)
        if (window.game && window.game.restart) {
            window.game.restart();
        } else {
            // 페이지 새로고침으로 대체
            window.location.reload();
        }
    }
    
    /**
     * 표시
     */
    show() {
        this.element.style.display = 'flex';
        this.visible = true;
        
        // 애니메이션 효과
        setTimeout(() => {
            this.element.classList.add('visible');
        }, 10);
    }
    
    /**
     * 숨기기
     */
    hide() {
        this.element.classList.remove('visible');
        
        setTimeout(() => {
            this.element.style.display = 'none';
            this.visible = false;
        }, 300);
    }
    
    /**
     * 제거
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
        this.visible = false;
    }
}

// 싱글톤 인스턴스
export const victoryMessage = new VictoryMessage();

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .victory-message-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
        backdrop-filter: blur(5px);
    }
    
    .victory-message-overlay.visible {
        opacity: 1;
    }
    
    .victory-message-content {
        background: linear-gradient(145deg, #2a2a2a, #1a1a1a);
        border: 3px solid #444;
        border-radius: 20px;
        padding: 40px;
        text-align: center;
        color: white;
        font-family: Arial, sans-serif;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
        transform: scale(0.8);
        transition: transform 0.3s ease;
        min-width: 400px;
    }
    
    .victory-message-overlay.visible .victory-message-content {
        transform: scale(1);
    }
    
    .victory-icon {
        font-size: 80px;
        margin-bottom: 20px;
        display: block;
        animation: bounce 0.6s ease-in-out;
    }
    
    .victory-icon.victory {
        color: #4CAF50;
        text-shadow: 0 0 20px rgba(76, 175, 80, 0.5);
    }
    
    .victory-icon.defeat {
        color: #f44336;
        text-shadow: 0 0 20px rgba(244, 67, 54, 0.5);
    }
    
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
        }
        40% {
            transform: translateY(-20px);
        }
        60% {
            transform: translateY(-10px);
        }
    }
    
    .victory-title {
        font-size: 48px;
        font-weight: bold;
        margin-bottom: 15px;
        text-transform: uppercase;
        letter-spacing: 3px;
    }
    
    .victory-title.victory {
        color: #4CAF50;
        text-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
    }
    
    .victory-title.defeat {
        color: #f44336;
        text-shadow: 0 0 10px rgba(244, 67, 54, 0.3);
    }
    
    .victory-subtitle {
        font-size: 18px;
        color: #aaa;
        margin-bottom: 30px;
        line-height: 1.4;
    }
    
    .victory-buttons {
        display: flex;
        gap: 15px;
        justify-content: center;
    }
    
    .victory-btn {
        padding: 12px 30px;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .victory-btn.primary {
        background: linear-gradient(45deg, #4CAF50, #45a049);
        color: white;
        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
    }
    
    .victory-btn.primary:hover {
        background: linear-gradient(45deg, #45a049, #4CAF50);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    }
    
    .victory-btn.secondary {
        background: linear-gradient(45deg, #666, #555);
        color: white;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    
    .victory-btn.secondary:hover {
        background: linear-gradient(45deg, #777, #666);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    }
    
    .victory-btn:active {
        transform: translateY(0);
    }
`;
document.head.appendChild(style);