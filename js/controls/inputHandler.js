/**
 * 입력 핸들러
 * 
 * 마우스와 키보드 입력을 감지하고 이벤트를 발행합니다.
 * 게임 로직은 포함하지 않습니다.
 * 
 * @module inputHandler
 */

import * as THREE from 'three';
import { gameState } from '../core/gameState.js';
import { sceneSetup } from '../core/sceneSetup.js';
import { eventBus, GameEvents } from '../core/eventBus.js';
import { createParticleEffect } from '../utils/animation.js';
import { movementSystem } from '../systems/movementSystem.js'; // 호버 효과에 필요

/**
 * 입력 핸들러 클래스
 * 
 * @class InputHandler
 */
export class InputHandler {
    constructor() {
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredTile = null;
        this.enabled = true;
        this.keys = {
            space: false,
            escape: false,
            shift: false,
            ctrl: false,
        };
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = sceneSetup.renderer.domElement;
        canvas.addEventListener('click', (e) => this.onClick(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    onClick(event) {
        if (!this.enabled || !gameState.isPlaying() || event.button !== 0) return;

        this.updateMousePosition(event);
        const intersects = this.performRaycast();

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            const intersectionPoint = intersects[0].point;
            this.createClickParticles(intersectionPoint);

            let character = null;
            let tile = null;
            let currentObject = clickedObject;
            let depth = 0;
            
            while (currentObject && depth < 10) {
                if (currentObject.userData.character) {
                    character = currentObject.userData.character;
                    break;
                }
                if (currentObject.userData.tile) {
                    tile = currentObject.userData.tile;
                    break;
                }
                currentObject = currentObject.parent;
            }

            if (character) {
                eventBus.emit(GameEvents.INPUT_CHARACTER_CLICKED, { character });
            } else if (tile) {
                eventBus.emit(GameEvents.INPUT_TILE_CLICKED, { tile });
            } else {
                eventBus.emit(GameEvents.INPUT_EMPTY_SPACE_CLICKED);
            }
        } else {
            eventBus.emit(GameEvents.INPUT_EMPTY_SPACE_CLICKED);
        }
    }

    onMouseMove(event) {
        if (!this.enabled) return;
        this.updateMousePosition(event);
        this.handleHover();
    }

    onKeyDown(event) {
        if (!this.enabled) return;
        switch (event.code) {
            case 'Space':
                event.preventDefault();
                this.keys.space = true;
                gameState.toggleAttackMode(); // 간단한 상태 변경은 유지
                break;
            case 'Escape':
                this.keys.escape = true;
                eventBus.emit(GameEvents.INPUT_EMPTY_SPACE_CLICKED); // ESC도 선택 취소로 처리
                break;
        }
    }

    onKeyUp(event) {
        if (event.code === 'Space') this.keys.space = false;
        if (event.code === 'Escape') this.keys.escape = false;
    }

    updateMousePosition(event) {
        const rect = sceneSetup.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    performRaycast() {
        this.raycaster.setFromCamera(this.mouse, sceneSetup.camera);
        const objectsToTest = [];
        sceneSetup.scene.traverse((object) => {
            if (object.userData.character || object.userData.tile) {
                objectsToTest.push(object);
            }
        });
        return this.raycaster.intersectObjects(objectsToTest, true);
    }

    handleHover() {
        const intersects = this.performRaycast();
        
        if (this.hoveredTile) {
            this.hoveredTile.setHighlight(false);
            this.hoveredTile = null;
        }
        
        if (intersects.length > 0) {
            const hoveredObject = intersects[0].object;
            const tile = hoveredObject.userData.tile;

            if (tile) {
                const selectedCharacter = gameState.selectedCharacter;
                if (selectedCharacter && !gameState.isAttackMode && !tile.isOccupied()) {
                    movementSystem.showPathPreview(selectedCharacter, tile);
                } else {
                    tile.setHighlight(true);
                }
                this.hoveredTile = tile;
            }
        } else {
            movementSystem.clearPathPreview();
        }
    }
    
    onTouchEnd(event) {
        if (!this.enabled || event.touches.length > 0) return;
        const touch = event.changedTouches[0];
        const mouseEvent = new MouseEvent('click', {
            clientX: touch.clientX,
            clientY: touch.clientY,
            button: 0
        });
        this.onClick(mouseEvent);
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.hoveredTile = null;
            movementSystem.clearAllHighlights();
        }
    }

    createClickParticles(position) {
        const options = {
            count: 20,
            size: 0.2,
            color: 0x00ffff,
            lifetime: 1000,
            velocity: { x: 0, y: 2, z: 0 },
            spread: 1.5,
            gravity: -3
        };
        const particleEffect = createParticleEffect(sceneSetup.scene, options);
        particleEffect.position.copy(position);
        const updateParticles = () => {
            if (particleEffect.userData.update) {
                particleEffect.userData.update();
            }
        };
        particleEffect.userData.updateId = setInterval(updateParticles, 16);
        setTimeout(() => {
            clearInterval(particleEffect.userData.updateId);
            sceneSetup.scene.remove(particleEffect);
            if (particleEffect.geometry) particleEffect.geometry.dispose();
            if (particleEffect.material) particleEffect.material.dispose();
        }, 2000);
    }
}

export const inputHandler = new InputHandler();