/**
 * 입력 핸들러
 * 
 * 마우스와 키보드 입력을 처리하고 게임 상호작용을 관리합니다.
 * 
 * @module inputHandler
 */

import * as THREE from 'three';
import { gameState } from '../core/gameState.js';
import { sceneSetup } from '../core/sceneSetup.js';
import { gridSystem } from '../systems/gridSystem.js';
import { movementSystem } from '../systems/movementSystem.js';
import { combatSystem } from '../systems/combatSystem.js';
import { aiSystem } from '../systems/aiSystem.js';
import { TURN_TYPE, CHARACTER_TYPE } from '../core/constants.js';

/**
 * 입력 핸들러 클래스
 * 
 * @class InputHandler
 */
export class InputHandler {
    constructor() {
        /**
         * 레이캐스터 (마우스 피킹용)
         * @type {THREE.Raycaster}
         * @tutorial https://threejs.org/docs/#api/en/core/Raycaster
         */
        this.raycaster = new THREE.Raycaster();
        
        /**
         * 마우스 위치 (정규화된 좌표)
         * @type {THREE.Vector2}
         */
        this.mouse = new THREE.Vector2();
        
        /**
         * 현재 호버 중인 타일
         * @type {HexTile|null}
         */
        this.hoveredTile = null;
        
        /**
         * 입력 처리 활성화 여부
         * @type {boolean}
         */
        this.enabled = true;
        
        /**
         * 키보드 상태
         * @type {Object}
         */
        this.keys = {
            space: false,
            escape: false,
            shift: false,
            ctrl: false,
        };
    }
    
    /**
     * 입력 핸들러 초기화
     */
    init() {
        this.setupEventListeners();
        console.log('입력 핸들러 초기화 완료');
    }
    
    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        const canvas = sceneSetup.renderer.domElement;
        
        // 마우스 이벤트
        canvas.addEventListener('click', (e) => this.onClick(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // 키보드 이벤트
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // 터치 이벤트 (모바일)
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    /**
     * 마우스 클릭 이벤트 처리
     * 
     * @param {MouseEvent} event
     */
    onClick(event) {
        if (!this.enabled || !gameState.isPlaying()) return;
        if (event.button !== 0) return; // 좌클릭만 처리
        
        // 마우스 위치 업데이트
        this.updateMousePosition(event);
        
        // 레이캐스팅으로 클릭한 객체 찾기
        const intersects = this.performRaycast();
        
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            
            // 타일 클릭 처리
            if (clickedObject.userData.tile) {
                this.handleTileClick(clickedObject.userData.tile);
            }
            // 캐릭터 클릭 처리
            else if (clickedObject.userData.character) {
                this.handleCharacterClick(clickedObject.userData.character);
            }
        }
    }
    
    /**
     * 마우스 이동 이벤트 처리
     * 
     * @param {MouseEvent} event
     */
    onMouseMove(event) {
        if (!this.enabled) return;
        
        // 마우스 위치 업데이트
        this.updateMousePosition(event);
        
        // 호버 효과 처리
        this.handleHover();
    }
    
    /**
     * 마우스 다운 이벤트 처리
     * 
     * @param {MouseEvent} event
     */
    onMouseDown(event) {
        if (!this.enabled) return;
        // 드래그 시작 등의 추가 기능을 여기에 구현할 수 있습니다
    }
    
    /**
     * 마우스 업 이벤트 처리
     * 
     * @param {MouseEvent} event
     */
    onMouseUp(event) {
        if (!this.enabled) return;
        // 드래그 종료 등의 추가 기능을 여기에 구현할 수 있습니다
    }
    
    /**
     * 키보드 다운 이벤트 처리
     * 
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
        if (!this.enabled) return;
        
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.keys.space = true;
                this.handleSpaceKey();
                break;
                
            case 'Escape':
                this.keys.escape = true;
                this.handleEscapeKey();
                break;
                
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.shift = true;
                break;
                
            case 'ControlLeft':
            case 'ControlRight':
                this.keys.ctrl = true;
                break;
                
            // 디버그 키
            case 'KeyD':
                if (this.keys.ctrl) {
                    this.toggleDebugMode();
                }
                break;
        }
    }
    
    /**
     * 키보드 업 이벤트 처리
     * 
     * @param {KeyboardEvent} event
     */
    onKeyUp(event) {
        switch (event.code) {
            case 'Space':
                this.keys.space = false;
                break;
                
            case 'Escape':
                this.keys.escape = false;
                break;
                
            case 'ShiftLeft':
            case 'ShiftRight':
                this.keys.shift = false;
                break;
                
            case 'ControlLeft':
            case 'ControlRight':
                this.keys.ctrl = false;
                break;
        }
    }
    
    /**
     * 마우스 위치 업데이트
     * 
     * @param {MouseEvent} event
     */
    updateMousePosition(event) {
        const rect = sceneSetup.renderer.domElement.getBoundingClientRect();
        
        // 정규화된 좌표로 변환 (-1 ~ 1)
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
    
    /**
     * 레이캐스팅 수행
     * 
     * @returns {THREE.Intersection[]} 교차점 배열
     */
    performRaycast() {
        this.raycaster.setFromCamera(this.mouse, sceneSetup.camera);
        
        // 씬의 모든 객체와 교차 검사
        const intersects = this.raycaster.intersectObjects(sceneSetup.scene.children, true);
        
        return intersects;
    }
    
    /**
     * 타일 클릭 처리
     * 
     * @param {HexTile} tile
     */
    handleTileClick(tile) {
        if (!gameState.isPlayerTurn()) {
            console.log('플레이어 턴이 아닙니다');
            return;
        }
        
        const selectedCharacter = gameState.selectedCharacter;
        
        if (selectedCharacter && selectedCharacter.type === CHARACTER_TYPE.PLAYER) {
            if (gameState.isAttackMode) {
                // 공격 모드
                if (tile.isOccupied() && tile.occupant.type === CHARACTER_TYPE.ENEMY) {
                    this.performAttack(selectedCharacter, tile.occupant);
                }
            } else {
                // 이동 모드
                if (!tile.isOccupied() && movementSystem.canMoveTo(selectedCharacter, tile)) {
                    this.performMove(selectedCharacter, tile);
                }
            }
        }
    }
    
    /**
     * 캐릭터 클릭 처리
     * 
     * @param {Character} character
     */
    handleCharacterClick(character) {
        if (!gameState.isPlayerTurn()) return;
        
        if (character.type === CHARACTER_TYPE.PLAYER) {
            // 플레이어 캐릭터 선택
            this.selectCharacter(character);
        } else if (character.type === CHARACTER_TYPE.ENEMY) {
            // 적 캐릭터 클릭 - 공격 시도
            const selectedCharacter = gameState.selectedCharacter;
            if (selectedCharacter && gameState.isAttackMode) {
                this.performAttack(selectedCharacter, character);
            }
        }
    }
    
    /**
     * 캐릭터 선택
     * 
     * @param {Character} character
     */
    selectCharacter(character) {
        // 이전 선택 해제
        movementSystem.clearAllHighlights();
        
        // 새 캐릭터 선택
        gameState.selectCharacter(character);
        
        // 행동 가능한 경우 이동/공격 가능 영역 표시
        if (character.canAct()) {
            if (gameState.isAttackMode && !character.hasAttacked) {
                this.showAttackableArea(character);
            } else if (!character.hasMoved) {
                movementSystem.showMovableTiles(character);
            }
        }
        
        console.log(`${character.name} 선택됨`);
    }
    
    /**
     * 이동 실행
     * 
     * @param {Character} character
     * @param {HexTile} targetTile
     */
    performMove(character, targetTile) {
        movementSystem.moveCharacter(character, targetTile, () => {
            // 이동 후 처리
            movementSystem.clearAllHighlights();
            
            // 자동으로 공격 모드로 전환 (옵션)
            if (!character.hasAttacked) {
                gameState.isAttackMode = true;
                this.showAttackableArea(character);
            }
            
            // 모든 행동 완료 시 자동 턴 종료 (옵션)
            if (character.hasAttacked && character.hasMoved) {
                this.checkAutoEndTurn();
            }
        });
    }
    
    /**
     * 공격 실행
     * 
     * @param {Character} attacker
     * @param {Character} target
     */
    performAttack(attacker, target) {
        combatSystem.performAttack(attacker, target, () => {
            // 공격 후 처리
            movementSystem.clearAllHighlights();
            
            // 모든 행동 완료 시 자동 턴 종료 (옵션)
            if (attacker.hasAttacked && attacker.hasMoved) {
                this.checkAutoEndTurn();
            }
        });
    }
    
    /**
     * 공격 가능 영역 표시
     * 
     * @param {Character} character
     */
    showAttackableArea(character) {
        const attackableTiles = gridSystem.getAttackableTiles(character);
        
        attackableTiles.forEach(tile => {
            tile.setAttackable(true);
        });
        
        console.log(`${attackableTiles.length}개의 공격 가능한 타일 표시`);
    }
    
    /**
     * 호버 효과 처리
     */
    handleHover() {
        const intersects = this.performRaycast();
        
        // 이전 호버 타일 복원
        if (this.hoveredTile) {
            this.hoveredTile.setHighlight(false);
            this.hoveredTile = null;
        }
        
        // 새로운 호버 타일 찾기
        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;
            
            if (hoveredObject.userData.tile) {
                const tile = hoveredObject.userData.tile;
                
                // 이동 가능한 타일인 경우 경로 미리보기
                const selectedCharacter = gameState.selectedCharacter;
                if (selectedCharacter && !gameState.isAttackMode && !tile.isOccupied()) {
                    movementSystem.showPathPreview(selectedCharacter, tile);
                } else {
                    tile.setHighlight(true);
                }
                
                this.hoveredTile = tile;
            }
        } else {
            // 호버가 없을 때 경로 미리보기 제거
            movementSystem.clearPathPreview();
        }
    }
    
    /**
     * 스페이스 키 처리 (공격 모드 토글)
     */
    handleSpaceKey() {
        if (gameState.selectedCharacter && gameState.isPlayerTurn()) {
            gameState.toggleAttackMode();
            
            // 하이라이트 업데이트
            movementSystem.clearAllHighlights();
            
            const character = gameState.selectedCharacter;
            if (gameState.isAttackMode && !character.hasAttacked) {
                this.showAttackableArea(character);
            } else if (!character.hasMoved) {
                movementSystem.showMovableTiles(character);
            }
        }
    }
    
    /**
     * ESC 키 처리 (선택 취소)
     */
    handleEscapeKey() {
        gameState.clearSelection();
        movementSystem.clearAllHighlights();
    }
    
    /**
     * 자동 턴 종료 확인
     */
    checkAutoEndTurn() {
        if (gameState.settings.autoEndTurn) {
            // 모든 플레이어가 행동을 완료했는지 확인
            const allActionsComplete = gameState.playerCharacters
                .filter(char => char.isAlive())
                .every(char => !char.canAct());
            
            if (allActionsComplete) {
                this.endPlayerTurn();
            }
        }
    }
    
    /**
     * 플레이어 턴 종료
     */
    endPlayerTurn() {
        console.log('플레이어 턴 종료');
        
        // 선택 상태 초기화
        gameState.clearSelection();
        movementSystem.clearAllHighlights();
        
        // 턴 전환
        gameState.endTurn();
        
        // 적 턴 시작
        if (gameState.currentTurn === TURN_TYPE.ENEMY) {
            this.enabled = false; // 적 턴 동안 입력 비활성화
            
            setTimeout(() => {
                aiSystem.executeEnemyTurn(() => {
                    // 적 턴 종료 후 플레이어 턴으로
                    gameState.endTurn();
                    this.enabled = true;
                });
            }, 500);
        }
    }
    
    /**
     * 터치 이벤트 처리 (모바일)
     * 
     * @param {TouchEvent} event
     */
    onTouchEnd(event) {
        if (!this.enabled || event.touches.length > 0) return;
        
        // 터치 위치를 마우스 클릭으로 변환
        const touch = event.changedTouches[0];
        const mouseEvent = new MouseEvent('click', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0
        });
        
        this.onClick(mouseEvent);
    }
    
    /**
     * 디버그 모드 토글
     */
    toggleDebugMode() {
        console.log('디버그 모드 토글');
        // 디버그 기능 구현 (추후)
    }
    
    /**
     * 입력 활성화/비활성화
     * 
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        
        if (!enabled) {
            // 비활성화 시 상태 초기화
            this.hoveredTile = null;
            movementSystem.clearAllHighlights();
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const inputHandler = new InputHandler();