/**
 * 메인 게임 진입점
 *
 * 게임의 초기화와 메인 루프를 담당하는 핵심 모듈입니다.
 * 모든 시스템과 컴포넌트를 초기화하고 게임 루프를 실행합니다.
 *
 * @module main
 */

import * as THREE from 'three';

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
import { soundSystem } from './systems/soundSystem.js';
import { battleManager } from './managers/battleManager.js';
import { resourceManager } from './managers/resourceManager.js';
import { loadingScreen } from './ui/loadingScreen.js';
import { commandHistory } from './managers/commandHistory.js';

// Control 모듈
import { cameraControls } from './controls/cameraControls.js';
import { inputHandler } from './controls/inputHandler.js';

// UI 모듈
import { fpsCounter } from './ui/fpsCounter.js';
import { healthBarUI } from './ui/healthBarUI.js';
import { replayIndicator } from './ui/replayIndicator.js';
import { unifiedControlPanel } from './ui/unifiedControlPanel.js';
import { victoryMessage } from './ui/victoryMessage.js';

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

        try {
            // 로딩 스크린 생성
            loadingScreen.create();
            
            // 리소스 로드
            await resourceManager.loadAll(
                (progress) => {
                    loadingScreen.updateProgress(progress);
                },
                () => {
                    console.log('All resources loaded successfully');
                    loadingScreen.complete();
                },
                (error) => {
                    console.error('Resource loading error:', error);
                }
            );
            
            // Three.js 씬 설정
            const gameCanvas = document.getElementById('gameCanvas');
            const { scene, camera, renderer } = sceneSetup.init(gameCanvas);


            // 사운드 시스템 초기화
            await soundSystem.init();
            // UI 초기화 (캐릭터 생성 전에 해야 함)
            fpsCounter.init();
            healthBarUI.init();
            replayIndicator.init();
            unifiedControlPanel.init();
            victoryMessage.init();

            // 배틀 매니저 초기화
            battleManager.init();

            // 그리드 생성
            gridSystem.createGrid();

            // 캐릭터 생성
            this.createCharacters();

            // Calculate center of game board FIRST
            let centerX = 0, centerZ = 0, tileCount = 0;
            gridSystem.allTiles.forEach(tile => {
                const pos = tile.getPixelPosition();
                if (!isNaN(pos.x) && !isNaN(pos.z)) {
                    centerX += pos.x;
                    centerZ += pos.z;
                    tileCount++;
                } else {
                    console.error('Tile has NaN position!', tile);
                }
            });
            if (tileCount > 0) {
                centerX /= tileCount;
                centerZ /= tileCount;
            }

            
            // Check if center values are valid
            if (isNaN(centerX) || isNaN(centerZ)) {
                console.error('Board center is NaN!', { centerX, centerZ, tileCount });
                centerX = 0;
                centerZ = 0;
            }

            // Force camera to a good position FIRST
            camera.position.set(centerX + 10, 15, centerZ + 10);
            camera.lookAt(centerX, 0, centerZ);
            
            // Set board center AFTER camera is positioned
            cameraControls.setBoardCenter(centerX, centerZ);

            // NOW initialize controls
            cameraControls.init();

            inputHandler.init();

            // 전투 시스템 콜백 설정
            this.setupSystemCallbacks();

            // 게임 시작 메시지
            unifiedControlPanel.addLog('게임이 시작되었습니다!', 'system');
            unifiedControlPanel.addLog('플레이어 턴 1 시작', 'turn');

            this.initialized = true;

            // 게임 루프 시작
            this.startGameLoop();

        } catch (error) {
            console.error('게임 초기화 실패:', error);
            unifiedControlPanel.addLog('게임 초기화 중 오류가 발생했습니다.', 'system');
        }
    }

    /**
     * 캐릭터 생성
     */
    createCharacters() {

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
                player.updateActionVisual();
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
                enemy.updateActionVisual();
            }
        });

    }

    /**
     * 시스템 콜백 설정
     */
    setupSystemCallbacks() {
        // 배틀 매니저 콜백
        battleManager.callbacks.onDamageDealt = (attacker, target, damage) => {
            unifiedControlPanel.addLog(
                `${attacker.name}이(가) ${target.name}에게 ${damage}의 데미지를 입혔습니다!`,
                'damage'
            );
        };
        
        battleManager.callbacks.onCharacterDeath = (character) => {
            unifiedControlPanel.addLog(`${character.name}이(가) 쓰러졌습니다!`, 'system');
            
            // 캐릭터 제거 (약간의 딜레이 후)
            setTimeout(() => {
                sceneSetup.scene.remove(character.group);
                character.dispose();
            }, 2000);
        };
        
        battleManager.callbacks.onBattleEnd = (result) => {
            const isVictory = result === 'player_won';
            const message = isVictory ? '플레이어 승리!' : '플레이어 패배!';
            unifiedControlPanel.addLog(message, 'system');
            
            // 승리/패배 메시지 표시
            setTimeout(() => {
                if (isVictory) {
                    victoryMessage.showVictory();
                } else {
                    victoryMessage.showDefeat();
                }
            }, 1000); // 1초 후 표시
            
            // 게임 종료 처리
            this.handleGameEnd(isVictory);
        };
        
        // 기존 시스템 콜백도 유지 (호환성)
        combatSystem.onCombatLog = (message) => {
            unifiedControlPanel.addLog(message, 'damage');
        };
        
        combatSystem.onCharacterDeath = battleManager.callbacks.onCharacterDeath;
        combatSystem.onCombatEnd = battleManager.callbacks.onBattleEnd;

        // 이동 시스템 콜백
        battleManager.callbacks.onMoveComplete = (character) => {
            unifiedControlPanel.addLog(`${character.name}이(가) 이동했습니다.`, 'info');
        };
        
        movementSystem.onMoveComplete = battleManager.callbacks.onMoveComplete;

        // 입력 핸들러에 턴 종료 함수 연결
        inputHandler.endPlayerTurn = () => {
            unifiedControlPanel.addLog('플레이어 턴 종료', 'turn');

            // 턴 전환
            gameState.endTurn();

            // 적 턴 시작
            if (gameState.currentTurn === TURN_TYPE.ENEMY) {
                unifiedControlPanel.addLog('적 턴 시작', 'turn');
                inputHandler.setEnabled(false);

                setTimeout(() => {
                    aiSystem.executeEnemyTurn(() => {
                        // 적 턴 종료
                        gameState.endTurn();
                        unifiedControlPanel.addLog(`플레이어 턴 ${Math.floor(gameState.turnCount)} 시작`, 'turn');
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
        let frameCount = 0;
        const clock = new THREE.Clock();

        const animate = () => {
            this.animationFrameId = requestAnimationFrame(animate);

            // Delta time for animations
            const delta = clock.getDelta();

            // FPS 카운터 업데이트
            fpsCounter.update();

            // 캐릭터 애니메이션 업데이트
            gameState.allCharacters.forEach(character => {
                character.update(delta);
            });

            // 카메라 업데이트
            cameraControls.updateCameraPosition();
            
            // 2D 체력바 위치 업데이트
            healthBarUI.updateAllPositions(gameState.allCharacters);

            // 렌더링
            sceneSetup.render();

            // Debug: Log first few frames
            if (frameCount < 5) {
                frameCount++;
            }
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
        // VictoryMessage 컴포넌트가 처리하므로 여기서는 별도 처리 없음
    }

    /**
     * 게임 재시작
     */
    restart() {

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
        unifiedControlPanel.clearLogs();
        fpsCounter.resetStats();
        
        // 체력바 초기화
        healthBarUI.clearAll();
    }

    /**
     * 게임 종료
     */
    destroy() {

        // 게임 루프 정지
        this.stopGameLoop();

        // 리소스 정리
        this.cleanup();

        // 시스템 정리
        sceneSetup.dispose();

        // UI 제거
        // combatLog.destroy(); // 더 이상 사용안함
        fpsCounter.destroy();
        healthBarUI.destroy();
        replayIndicator.destroy();
        unifiedControlPanel.destroy();
        victoryMessage.destroy();
        
        // 커맨드 히스토리 초기화
        commandHistory.clear();

    }
}

/**
 * 게임 인스턴스 생성 및 시작
 */
const game = new Game();

// DOM 로드 완료 시 게임 시작
function startGame() {
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) {
        console.error('gameCanvas element not found! Waiting...');
        setTimeout(startGame, 100);
        return;
    }
    game.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
} else {
    // Even if document is ready, ensure gameCanvas exists
    startGame();
}

// 전역 객체로 노출 (디버깅용)
window.game = game;
window.gameState = gameState;
window.gridSystem = gridSystem;

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
    if (game.initialized) {
        game.destroy();
    }
});
