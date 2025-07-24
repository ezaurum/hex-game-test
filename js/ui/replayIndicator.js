/**
 * 리플레이 인디케이터
 * 
 * 게임 화면에 리플레이 상태를 표시하는 UI 컴포넌트입니다.
 * 
 * @module replayIndicator
 */

import { eventBus } from '../core/eventBus.js';

/**
 * 리플레이 인디케이터 클래스
 * 
 * @class ReplayIndicator
 */
class ReplayIndicator {
    constructor() {
        /**
         * 인디케이터 엘리먼트
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
        this.subscribeToEvents();
    }
    
    /**
     * 엘리먼트 생성
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.id = 'replay-indicator';
        this.element.className = 'replay-indicator';
        this.element.innerHTML = `
            <div class="replay-icon">▶</div>
            <div class="replay-text">리플레이 진행 중...</div>
        `;
        
        document.body.appendChild(this.element);
        
        // 초기에는 숨김
        this.hide();
    }
    
    /**
     * 이벤트 구독
     */
    subscribeToEvents() {
        // 리플레이 시작
        eventBus.on('replay:started', () => {
            this.show();
        });
        
        // 리플레이 종료
        eventBus.on('replay:ended', () => {
            this.hide();
        });
    }
    
    /**
     * 표시
     */
    show() {
        this.element.style.display = 'flex';
        this.visible = true;
        
        // 애니메이션 효과
        setTimeout(() => {
            this.element.classList.add('active');
        }, 10);
    }
    
    /**
     * 숨기기
     */
    hide() {
        this.element.classList.remove('active');
        
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
export const replayIndicator = new ReplayIndicator();

// CSS 스타일 추가
const style = document.createElement('style');
style.textContent = `
    .replay-indicator {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 10px 20px;
        border-radius: 25px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: Arial, sans-serif;
        font-size: 16px;
        font-weight: bold;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.3s ease;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    
    .replay-indicator.active {
        opacity: 1;
    }
    
    .replay-icon {
        font-size: 20px;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
    }
`;
document.head.appendChild(style);