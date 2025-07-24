/**
 * 애니메이션 컨트롤 UI
 * 
 * 애니메이션 속도 조절, 스킵 기능을 제공합니다.
 * 
 * @module animationControl
 */

import { battleManager } from '../managers/battleManager.js';

/**
 * 애니메이션 컨트롤 클래스
 * 
 * @class AnimationControl
 */
class AnimationControl {
    constructor() {
        /**
         * UI 요소
         * @type {HTMLElement|null}
         */
        this.element = null;
        
        /**
         * 속도 슬라이더
         * @type {HTMLInputElement|null}
         */
        this.speedSlider = null;
        
        /**
         * 속도 표시
         * @type {HTMLElement|null}
         */
        this.speedDisplay = null;
        
        /**
         * 스킵 버튼
         * @type {HTMLButtonElement|null}
         */
        this.skipButton = null;
        
        /**
         * 전체 스킵 버튼
         * @type {HTMLButtonElement|null}
         */
        this.skipAllButton = null;
    }
    
    /**
     * 초기화
     */
    init() {
        this.createUI();
        this.setupEventListeners();
    }
    
    /**
     * UI 생성
     */
    createUI() {
        // 메인 컨테이너
        this.element = document.createElement('div');
        this.element.id = 'animationControl';
        this.element.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Noto Sans KR', Arial, sans-serif;
            font-size: 14px;
            user-select: none;
            z-index: 1000;
            min-width: 200px;
        `;
        
        // 제목
        const title = document.createElement('div');
        title.textContent = '애니메이션 컨트롤';
        title.style.cssText = `
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
        `;
        this.element.appendChild(title);
        
        // 속도 컨트롤
        const speedContainer = document.createElement('div');
        speedContainer.style.cssText = `
            margin-bottom: 10px;
        `;
        
        const speedLabel = document.createElement('label');
        speedLabel.textContent = '속도: ';
        speedLabel.style.cssText = `
            display: inline-block;
            width: 50px;
        `;
        speedContainer.appendChild(speedLabel);
        
        this.speedSlider = document.createElement('input');
        this.speedSlider.type = 'range';
        this.speedSlider.min = '0.1';
        this.speedSlider.max = '5';
        this.speedSlider.step = '0.1';
        this.speedSlider.value = '1';
        this.speedSlider.style.cssText = `
            width: 100px;
            vertical-align: middle;
        `;
        speedContainer.appendChild(this.speedSlider);
        
        this.speedDisplay = document.createElement('span');
        this.speedDisplay.textContent = '1.0x';
        this.speedDisplay.style.cssText = `
            margin-left: 10px;
            font-weight: bold;
        `;
        speedContainer.appendChild(this.speedDisplay);
        
        this.element.appendChild(speedContainer);
        
        // 버튼 컨테이너
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: center;
        `;
        
        // 현재 스킵 버튼
        this.skipButton = document.createElement('button');
        this.skipButton.textContent = '현재 스킵';
        this.skipButton.style.cssText = `
            padding: 5px 10px;
            background: #4a9eff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        buttonContainer.appendChild(this.skipButton);
        
        // 전체 스킵 버튼
        this.skipAllButton = document.createElement('button');
        this.skipAllButton.textContent = '전체 스킵';
        this.skipAllButton.style.cssText = `
            padding: 5px 10px;
            background: #ff4a4a;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        buttonContainer.appendChild(this.skipAllButton);
        
        this.element.appendChild(buttonContainer);
        
        // 단축키 안내
        const shortcutInfo = document.createElement('div');
        shortcutInfo.style.cssText = `
            margin-top: 10px;
            font-size: 11px;
            color: #888;
            text-align: center;
        `;
        shortcutInfo.innerHTML = `
            단축키: <b>S</b> - 현재 스킵<br>
            <b>Shift+S</b> - 전체 스킵
        `;
        this.element.appendChild(shortcutInfo);
        
        // DOM에 추가
        document.body.appendChild(this.element);
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        // 속도 슬라이더
        this.speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.speedDisplay.textContent = `${speed.toFixed(1)}x`;
            battleManager.setAnimationSpeed(speed);
        });
        
        // 스킵 버튼
        this.skipButton.addEventListener('click', () => {
            battleManager.skipCurrent();
        });
        
        // 전체 스킵 버튼
        this.skipAllButton.addEventListener('click', () => {
            battleManager.skipAll();
        });
        
        // 키보드 단축키
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 's') {
                if (e.shiftKey) {
                    battleManager.skipAll();
                } else {
                    battleManager.skipCurrent();
                }
            }
        });
        
        // 호버 효과
        [this.skipButton, this.skipAllButton].forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.opacity = '0.8';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.opacity = '1';
            });
        });
    }
    
    /**
     * 표시/숨기기
     * 
     * @param {boolean} visible - 표시 여부
     */
    setVisible(visible) {
        if (this.element) {
            this.element.style.display = visible ? 'block' : 'none';
        }
    }
    
    /**
     * 파괴
     */
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }
}

// 싱글톤 인스턴스
export const animationControl = new AnimationControl();