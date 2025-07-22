/**
 * 메인 게임 진입점
 * 
 * 게임의 초기화와 메인 루프를 담당하는 핵심 모듈입니다.
 * 모든 시스템과 컴포넌트를 초기화하고 게임 루프를 실행합니다.
 * 
 * @module main
 */

// Core 모듈
import { gameState } from './core/gameState.js';
import { sceneSetup } from './core/sceneSetup.js';
import { CHARACTER_TYPE, TURN_TYPE } from './core/constants.js';

// Entity 모듈
import { Character } from './entities/Character.js';

// System 모듈
import { gridSystem } from './systems/gridSystem.js';
import { combatSystem } from './systems/combatSystem.js';
import { movementSystem } from './systems/movementSystem.js';
import { aiSystem } from './systems/aiSystem.js';

// Control 모듈
import { cameraControls } from './controls/cameraControls.js';
import { inputHandler } from './controls/inputHandler.js';

// UI 모듈
import { combatLog } from './ui/combatLog.js';
import { fpsCounter } from './ui/fpsCounter.js';

/**
 * 게임 메인 클래스
 * 
 * @class Game
 */
class Game {
    constructor() {
        /**
         * 게임 초기화 완료 여부
         * @type {boolean}
         */
        this.initialized = false;
        
        /**
         * 애니메이션 프레임 ID
         * @type {number}
         */
        this.animationFrameId = null;
    }
    
    /**
     * 게임 초기화
     */
    async init() {
        console.log('게임 초기화 시작...');
        
        try {
            // Three.js 씬 설정
            const gameCanvas = document.getElementById('gameCanvas');
            const { scene, camera, renderer } = sceneSetup.init(gameCanvas);
            
            // 그리드 생성
            gridSystem.createGrid();
            
            // 캐릭터 생성
            this.createCharacters();
            
            // 컨트롤 초기화
            cameraControls.init();
            inputHandler.init();
            
            // UI 초기화
            combatLog.init();
            fpsCounter.init();
            
            // 전투 시스템 콜백 설정
            this.setupSystemCallbacks();
            
            // 게임 시작 메시지
            combatLog.addLog('게임이 시작되었습니다!', 'system');
            combatLog.addTurnLog('player', 1);
            
            this.initialized = true;
            console.log('게임 초기화 완료!');
            
            // 게임 루프 시작
            this.startGameLoop();
            
        } catch (error) {
            console.error('게임 초기화 실패:', error);
            combatLog.addLog('게임 초기화 중 오류가 발생했습니다.', 'system');
        }
    }
    
    /**
     * 캐릭터 생성
     */
    createCharacters() {
        console.log('캐릭터 생성 중...');
        
        // 플레이어 캐릭터 생성
        const playerPositions = [
            { q: -2, r: 0 },
            { q: -2, r: 1 },
            { q: -1, r: -1 },
        ];
        
        playerPositions.forEach((pos, index) => {
            const tile = gridSystem.getTile(pos.q, pos.r);
            if (tile) {
                const player = new Character(
                    CHARACTER_TYPE.PLAYER,
                    tile,
                    `플레이어 ${index + 1}`
                );
                gameState.addCharacter(player);
                sceneSetup.scene.add(player.group);
            }
        });
        
        // 적 캐릭터 생성
        const enemyPositions = [
            { q: 2, r: 0 },
            { q: 2, r: -1 },
            { q: 1, r: 1 },
        ];
        
        enemyPositions.forEach((pos, index) => {
            const tile = gridSystem.getTile(pos.q, pos.r);
            if (tile) {
                const enemy = new Character(
                    CHARACTER_TYPE.ENEMY,
                    tile,
                    `고블린 ${index + 1}`
                );
                gameState.addCharacter(enemy);
                sceneSetup.scene.add(enemy.group);
            }
        });
        
        console.log(`캐릭터 생성 완료: 플레이어 ${gameState.playerCharacters.length}명, 적 ${gameState.enemyCharacters.length}명`);
    }
    
    /**
     * 시스템 콜백 설정
     */
    setupSystemCallbacks() {
        // 전투 시스템 콜백
        combatSystem.onCombatLog = (message) => {
            combatLog.addLog(message, 'damage');
        };
        
        combatSystem.onCharacterDeath = (character) => {
            combatLog.addLog(`${character.name}이(가) 쓰러졌습니다!`, 'system');
            
            // 캐릭터 제거 (약간의 딜레이 후)
            setTimeout(() => {
                sceneSetup.scene.remove(character.group);
                character.dispose();
            }, 2000);
        };
        
        combatSystem.onCombatEnd = (result) => {
            const isVictory = result === 'player_won';
            combatLog.addGameEndLog(isVictory);
            
            // 게임 종료 처리
            this.handleGameEnd(isVictory);
        };
        
        // 이동 시스템 콜백
        movementSystem.onMoveComplete = (character) => {
            combatLog.addMoveLog(character.name);
        };
        
        // 입력 핸들러에 턴 종료 함수 연결
        inputHandler.endPlayerTurn = () => {
            combatLog.addLog('플레이어 턴 종료', 'turn');
            
            // 턴 전환
            gameState.endTurn();
            
            // 적 턴 시작
            if (gameState.currentTurn === TURN_TYPE.ENEMY) {
                combatLog.addTurnLog('enemy');
                inputHandler.setEnabled(false);
                
                setTimeout(() => {
                    aiSystem.executeEnemyTurn(() => {
                        // 적 턴 종료
                        gameState.endTurn();
                        combatLog.addTurnLog('player', Math.floor(gameState.turnCount));
                        inputHandler.setEnabled(true);
                    });
                }, 500);
            }
        };
    }
    
    /**
     * 게임 루프 시작
     */
    startGameLoop() {
        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);
            
            // FPS 카운터 업데이트
            fpsCounter.update();
            
            // 카메라 업데이트
            cameraControls.updateCameraPosition();
            
            // 렌더링
            sceneSetup.render();
        };
        
        animate();
    }
    
    /**
     * 게임 루프 정지
     */
    stopGameLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * 게임 종료 처리
     * 
     * @param {boolean} isVictory - 승리 여부
     */
    handleGameEnd(isVictory) {
        // 입력 비활성화
        inputHandler.setEnabled(false);
        
        // 결과 표시
        setTimeout(() => {
            const message = isVictory 
                ? '축하합니다! 모든 적을 물리쳤습니다!' 
                : '패배했습니다. 다시 도전해보세요!';
            
            if (confirm(message + '\n\n새 게임을 시작하시겠습니까?')) {
                this.restart();
            }
        }, 1000);
    }
    
    /**
     * 게임 재시작
     */
    restart() {
        console.log('게임 재시작...');
        
        // 게임 루프 정지
        this.stopGameLoop();
        
        // 씬 정리
        this.cleanup();
        
        // 게임 상태 초기화
        gameState.reset();
        
        // 재초기화
        this.init();
    }
    
    /**
     * 리소스 정리
     */
    cleanup() {
        // 모든 캐릭터 제거
        gameState.allCharacters.forEach(character => {
            sceneSetup.scene.remove(character.group);
            character.dispose();
        });
        
        // 그리드 정리
        gridSystem.dispose();
        
        // 하이라이트 초기화
        movementSystem.clearAllHighlights();
        
        // 로그 초기화
        combatLog.clearLogs();
        fpsCounter.resetStats();
    }
    
    /**
     * 게임 종료
     */
    destroy() {
        console.log('게임 종료...');
        
        // 게임 루프 정지
        this.stopGameLoop();
        
        // 리소스 정리
        this.cleanup();
        
        // 시스템 정리
        sceneSetup.dispose();
        
        // UI 제거
        combatLog.destroy();
        fpsCounter.destroy();
        
        console.log('게임이 완전히 종료되었습니다.');
    }
}

/**
 * 게임 인스턴스 생성 및 시작
 */
const game = new Game();

// DOM 로드 완료 시 게임 시작
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        game.init();
    });
} else {
    game.init();
}

// 전역 객체로 노출 (디버깅용)
window.game = game;
window.gameState = gameState;
window.gridSystem = gridSystem;

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    game.destroy();
});