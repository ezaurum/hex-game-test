/**
 * 로딩 스크린 UI
 * 
 * 리소스 로딩 중 진행 상황을 표시하는 UI 컴포넌트입니다.
 */

export class LoadingScreen {
    constructor() {
        this.container = null;
        this.progressBar = null;
        this.progressText = null;
        this.loadingText = null;
        this.itemsList = null;
    }
    
    /**
     * 로딩 스크린 생성
     */
    create() {
        // 컨테이너 생성
        this.container = document.createElement('div');
        this.container.id = 'loading-screen';
        this.container.innerHTML = `
            <div class="loading-content">
                <h1 class="loading-title">Loading Game Assets</h1>
                <div class="loading-progress-container">
                    <div class="loading-progress-bar">
                        <div class="loading-progress-fill"></div>
                    </div>
                    <div class="loading-progress-text">0%</div>
                </div>
                <div class="loading-current-item">Initializing...</div>
                <div class="loading-items-list"></div>
            </div>
        `;
        
        // 스타일 추가
        const style = document.createElement('style');
        style.textContent = `
            #loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #1a1a1a;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                font-family: 'Arial', sans-serif;
            }
            
            .loading-content {
                width: 80%;
                max-width: 500px;
                text-align: center;
            }
            
            .loading-title {
                color: #ffffff;
                font-size: 2em;
                margin-bottom: 30px;
                font-weight: 300;
                letter-spacing: 2px;
            }
            
            .loading-progress-container {
                margin-bottom: 20px;
            }
            
            .loading-progress-bar {
                width: 100%;
                height: 20px;
                background: #333;
                border-radius: 10px;
                overflow: hidden;
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .loading-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                width: 0%;
                transition: width 0.3s ease;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
            }
            
            .loading-progress-text {
                color: #ffffff;
                font-size: 1.2em;
                margin-top: 10px;
            }
            
            .loading-current-item {
                color: #aaa;
                font-size: 0.9em;
                margin-top: 20px;
                min-height: 20px;
            }
            
            .loading-items-list {
                margin-top: 30px;
                max-height: 200px;
                overflow-y: auto;
                text-align: left;
                padding: 0 20px;
            }
            
            .loading-item {
                color: #666;
                font-size: 0.8em;
                margin: 5px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .loading-item.loaded {
                color: #4CAF50;
            }
            
            .loading-item.failed {
                color: #f44336;
            }
            
            .loading-item-status {
                font-size: 0.9em;
            }
            
            /* 애니메이션 */
            @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
            }
            
            .loading-current-item {
                animation: pulse 1.5s infinite;
            }
            
            /* 완료 애니메이션 */
            #loading-screen.fade-out {
                animation: fadeOut 0.5s ease forwards;
            }
            
            @keyframes fadeOut {
                to {
                    opacity: 0;
                    transform: scale(1.1);
                }
            }
        `;
        document.head.appendChild(style);
        
        // DOM 요소 참조 저장
        this.progressBar = this.container.querySelector('.loading-progress-fill');
        this.progressText = this.container.querySelector('.loading-progress-text');
        this.loadingText = this.container.querySelector('.loading-current-item');
        this.itemsList = this.container.querySelector('.loading-items-list');
        
        // DOM에 추가
        document.body.appendChild(this.container);
    }
    
    /**
     * 진행 상황 업데이트
     * @param {Object} progress - 진행 상황 정보
     */
    updateProgress(progress) {
        const percent = Math.round(progress.percent);
        
        // 프로그레스 바 업데이트
        this.progressBar.style.width = `${percent}%`;
        this.progressText.textContent = `${percent}%`;
        
        // 현재 아이템 표시
        if (progress.currentItem) {
            this.loadingText.textContent = `Loading: ${progress.currentItem}`;
        }
        
        // 아이템 리스트 업데이트
        this.updateItemsList(progress.items);
        
        // 에러 처리
        if (progress.error) {
            console.error('Loading error:', progress.error);
        }
    }
    
    /**
     * 아이템 리스트 업데이트
     * @param {Map} items - 로딩 아이템 맵
     */
    updateItemsList(items) {
        this.itemsList.innerHTML = '';
        
        items.forEach((item, name) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = `loading-item ${item.status}`;
            
            let statusIcon = '';
            switch (item.status) {
                case 'loaded':
                    statusIcon = '✓';
                    break;
                case 'failed':
                    statusIcon = '✗';
                    break;
                case 'loading':
                    statusIcon = '⋯';
                    break;
            }
            
            itemDiv.innerHTML = `
                <span>${name}</span>
                <span class="loading-item-status">${statusIcon}</span>
            `;
            
            this.itemsList.appendChild(itemDiv);
        });
    }
    
    /**
     * 로딩 완료
     */
    complete() {
        this.progressBar.style.width = '100%';
        this.progressText.textContent = '100%';
        this.loadingText.textContent = 'Loading complete!';
        
        // 페이드 아웃 애니메이션
        setTimeout(() => {
            this.container.classList.add('fade-out');
            
            // 애니메이션 후 제거
            setTimeout(() => {
                this.hide();
            }, 500);
        }, 500);
    }
    
    /**
     * 로딩 스크린 표시
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
        }
    }
    
    /**
     * 로딩 스크린 숨기기
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }
    
    /**
     * 로딩 스크린 제거
     */
    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.container = null;
    }
}

// 싱글톤 인스턴스
export const loadingScreen = new LoadingScreen();