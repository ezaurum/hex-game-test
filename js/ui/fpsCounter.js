/**
 * FPS 카운터 UI
 * 
 * 게임의 프레임 레이트(FPS)를 실시간으로 표시하는 UI 컴포넌트입니다.
 * 성능 모니터링과 최적화에 유용합니다.
 * 
 * @module fpsCounter
 */

/**
 * FPS 카운터 클래스
 * 
 * @class FPSCounter
 */
export class FPSCounter {
    constructor() {
        /**
         * FPS 디스플레이 DOM 요소
         * @type {HTMLElement}
         */
        this.display = null;
        
        /**
         * 프레임 시간 기록
         * @type {number[]}
         */
        this.frameTimes = [];
        
        /**
         * 마지막 프레임 시간
         * @type {number}
         */
        this.lastFrameTime = performance.now();
        
        /**
         * FPS 업데이트 주기 (밀리초)
         * @type {number}
         */
        this.updateInterval = 500;
        
        /**
         * 마지막 업데이트 시간
         * @type {number}
         */
        this.lastUpdateTime = 0;
        
        /**
         * 현재 FPS
         * @type {number}
         */
        this.currentFPS = 0;
        
        /**
         * 평균 FPS
         * @type {number}
         */
        this.averageFPS = 0;
        
        /**
         * 최소 FPS
         * @type {number}
         */
        this.minFPS = Infinity;
        
        /**
         * 최대 FPS
         * @type {number}
         */
        this.maxFPS = 0;
        
        /**
         * 표시 모드
         * @type {string} 'simple' | 'detailed'
         */
        this.displayMode = 'simple';
        
        /**
         * 활성화 상태
         * @type {boolean}
         */
        this.enabled = true;
    }
    
    /**
     * FPS 카운터 초기화
     */
    init() {
        this.createUI();
        this.applyStyles();
        console.log('FPS 카운터 초기화 완료');
    }
    
    /**
     * UI 요소 생성
     */
    createUI() {
        // 기존 요소 찾기 또는 생성
        this.display = document.getElementById('fps-counter');
        if (!this.display) {
            this.display = document.createElement('div');
            this.display.id = 'fps-counter';
            this.display.className = 'fps-counter';
            document.body.appendChild(this.display);
        }
        
        // 초기 텍스트
        this.updateDisplay();
        
        // 클릭 이벤트로 모드 전환
        this.display.addEventListener('click', () => {
            this.toggleDisplayMode();
        });
    }
    
    /**
     * 스타일 적용
     */
    applyStyles() {
        // 스타일이 이미 추가되었는지 확인
        if (document.getElementById('fps-counter-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'fps-counter-styles';
        style.textContent = `
            .fps-counter {
                position: fixed;
                top: 10px;
                left: 10px;
                padding: 5px 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                font-family: monospace;
                font-size: 12px;
                border-radius: 3px;
                z-index: 1000;
                cursor: pointer;
                user-select: none;
                transition: all 0.3s ease;
                min-width: 60px;
            }
            
            .fps-counter:hover {
                background: rgba(0, 0, 0, 0.9);
            }
            
            .fps-counter.good {
                color: #51cf66;
            }
            
            .fps-counter.warning {
                color: #fab005;
            }
            
            .fps-counter.bad {
                color: #ff6b6b;
            }
            
            .fps-counter.detailed {
                padding: 10px;
                min-width: 150px;
            }
            
            .fps-counter .fps-main {
                font-size: 16px;
                font-weight: bold;
            }
            
            .fps-counter .fps-stats {
                margin-top: 5px;
                font-size: 11px;
                opacity: 0.8;
            }
            
            .fps-counter .fps-stat-line {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
            }
            
            @media (max-width: 768px) {
                .fps-counter {
                    font-size: 11px;
                }
                
                .fps-counter .fps-main {
                    font-size: 14px;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * FPS 업데이트
     * 
     * 매 프레임마다 호출되어야 합니다.
     * @param {number} [currentTime] - 현재 시간 (performance.now())
     */
    update(currentTime = performance.now()) {
        if (!this.enabled) return;
        
        // 프레임 시간 계산
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        // 프레임 시간 기록 (최근 60프레임만 유지)
        this.frameTimes.push(deltaTime);
        if (this.frameTimes.length > 60) {
            this.frameTimes.shift();
        }
        
        // 업데이트 주기 확인
        if (currentTime - this.lastUpdateTime >= this.updateInterval) {
            this.calculateFPS();
            this.updateDisplay();
            this.lastUpdateTime = currentTime;
        }
    }
    
    /**
     * FPS 계산
     */
    calculateFPS() {
        if (this.frameTimes.length === 0) return;
        
        // 평균 프레임 시간 계산
        const averageFrameTime = this.frameTimes.reduce((a, b) => a + b) / this.frameTimes.length;
        
        // FPS 계산 (1000ms / 평균 프레임 시간)
        this.currentFPS = Math.round(1000 / averageFrameTime);
        
        // 평균 FPS 업데이트 (지수 이동 평균)
        if (this.averageFPS === 0) {
            this.averageFPS = this.currentFPS;
        } else {
            this.averageFPS = Math.round(this.averageFPS * 0.9 + this.currentFPS * 0.1);
        }
        
        // 최소/최대 FPS 업데이트
        this.minFPS = Math.min(this.minFPS, this.currentFPS);
        this.maxFPS = Math.max(this.maxFPS, this.currentFPS);
    }
    
    /**
     * 디스플레이 업데이트
     */
    updateDisplay() {
        if (!this.display) return;
        
        // FPS에 따른 색상 클래스
        this.display.classList.remove('good', 'warning', 'bad');
        if (this.currentFPS >= 50) {
            this.display.classList.add('good');
        } else if (this.currentFPS >= 30) {
            this.display.classList.add('warning');
        } else {
            this.display.classList.add('bad');
        }
        
        // 표시 모드에 따른 내용
        if (this.displayMode === 'simple') {
            this.display.classList.remove('detailed');
            this.display.innerHTML = `FPS: ${this.currentFPS}`;
        } else {
            this.display.classList.add('detailed');
            this.display.innerHTML = `
                <div class="fps-main">FPS: ${this.currentFPS}</div>
                <div class="fps-stats">
                    <div class="fps-stat-line">
                        <span>평균:</span>
                        <span>${this.averageFPS}</span>
                    </div>
                    <div class="fps-stat-line">
                        <span>최소:</span>
                        <span>${this.minFPS === Infinity ? '-' : this.minFPS}</span>
                    </div>
                    <div class="fps-stat-line">
                        <span>최대:</span>
                        <span>${this.maxFPS}</span>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * 표시 모드 전환
     */
    toggleDisplayMode() {
        this.displayMode = this.displayMode === 'simple' ? 'detailed' : 'simple';
        this.updateDisplay();
    }
    
    /**
     * 통계 초기화
     */
    resetStats() {
        this.frameTimes = [];
        this.currentFPS = 0;
        this.averageFPS = 0;
        this.minFPS = Infinity;
        this.maxFPS = 0;
        this.updateDisplay();
    }
    
    /**
     * FPS 카운터 표시/숨기기
     * 
     * @param {boolean} visible
     */
    setVisible(visible) {
        if (this.display) {
            this.display.style.display = visible ? 'block' : 'none';
        }
        this.enabled = visible;
    }
    
    /**
     * 위치 설정
     * 
     * @param {string} position - 'top-left', 'top-right', 'bottom-left', 'bottom-right'
     */
    setPosition(position) {
        if (!this.display) return;
        
        // 기존 위치 스타일 제거
        this.display.style.top = '';
        this.display.style.bottom = '';
        this.display.style.left = '';
        this.display.style.right = '';
        
        // 새 위치 적용
        switch (position) {
            case 'top-left':
                this.display.style.top = '10px';
                this.display.style.left = '10px';
                break;
            case 'top-right':
                this.display.style.top = '10px';
                this.display.style.right = '10px';
                break;
            case 'bottom-left':
                this.display.style.bottom = '10px';
                this.display.style.left = '10px';
                break;
            case 'bottom-right':
                this.display.style.bottom = '10px';
                this.display.style.right = '10px';
                break;
        }
    }
    
    /**
     * 성능 정보 가져오기
     * 
     * @returns {Object} 성능 정보
     */
    getPerformanceInfo() {
        return {
            currentFPS: this.currentFPS,
            averageFPS: this.averageFPS,
            minFPS: this.minFPS === Infinity ? 0 : this.minFPS,
            maxFPS: this.maxFPS,
            frameCount: this.frameTimes.length,
            isPerformanceGood: this.currentFPS >= 50,
            isPerformanceAcceptable: this.currentFPS >= 30,
        };
    }
    
    /**
     * 낮은 FPS 경고 콜백 설정
     * 
     * @param {Function} callback - 콜백 함수
     * @param {number} [threshold=20] - FPS 임계값
     */
    onLowFPS(callback, threshold = 20) {
        // 프레임 업데이트마다 체크
        const originalUpdate = this.update.bind(this);
        this.update = (currentTime) => {
            originalUpdate(currentTime);
            
            if (this.currentFPS > 0 && this.currentFPS < threshold) {
                callback(this.currentFPS);
            }
        };
    }
    
    /**
     * UI 제거
     */
    destroy() {
        if (this.display && this.display.parentNode) {
            this.display.parentNode.removeChild(this.display);
        }
        
        // 스타일 제거
        const style = document.getElementById('fps-counter-styles');
        if (style && style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const fpsCounter = new FPSCounter();