/**
 * 게임 매니저
 * 
 * 게임의 전반적인 흐름과 사용자 입력에 따른 로직을 관리합니다.
 * 
 * @module gameManager
 */

import { eventBus, GameEvents } from '../core/eventBus.js';
import { gameState } from '../core/gameState.js';
import { CHARACTER_TYPE } from '../core/constants.js';
import { movementSystem } from '../systems/movementSystem.js';
import { battleManager } from './battleManager.js';
import { gridSystem } from '../systems/gridSystem.js';

class GameManager {
    constructor() {
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        this.subscribeToEvents();
        this.initialized = true;
    }

    subscribeToEvents() {
        eventBus.on(GameEvents.INPUT_TILE_CLICKED, ({ tile }) => this.onTileClicked(tile));
        eventBus.on(GameEvents.INPUT_CHARACTER_CLICKED, ({ character }) => this.onCharacterClicked(character));
        eventBus.on(GameEvents.INPUT_EMPTY_SPACE_CLICKED, () => this.onEmptySpaceClicked());
    }

    onTileClicked(tile) {
        if (!gameState.isPlayerTurn()) return;

        // 타일에 플레이어 캐릭터가 있으면 선택
        if (tile.isOccupied() && tile.occupant.type === CHARACTER_TYPE.PLAYER) {
            this.selectPlayerCharacter(tile.occupant);
            return;
        }

        const selectedCharacter = gameState.selectedCharacter;

        if (selectedCharacter) {
            // 적 캐릭터가 있는 타일 클릭 시 공격
            if (tile.isOccupied() && tile.occupant.type === CHARACTER_TYPE.ENEMY) {
                battleManager.performAttack(selectedCharacter, tile.occupant);
            }
            // 비어있는 타일 클릭 시 이동
            else if (!tile.isOccupied()) {
                const path = gridSystem.findPath(selectedCharacter.currentTile, tile);
                if (path.length > 0 && path.length <= selectedCharacter.movementRange - selectedCharacter.movedDistance) {
                    battleManager.moveCharacter(selectedCharacter, path);
                }
            }
        }
    }

    onCharacterClicked(character) {
        if (!gameState.isPlayerTurn()) return;

        if (character.type === CHARACTER_TYPE.PLAYER) {
            this.selectPlayerCharacter(character);
        } else if (character.type === CHARACTER_TYPE.ENEMY) {
            const selectedCharacter = gameState.selectedCharacter;
            if (selectedCharacter) {
                battleManager.performAttack(selectedCharacter, character);
            }
        }
    }

    onEmptySpaceClicked() {
        gameState.clearSelection();
        movementSystem.clearAllHighlights();
    }

    selectPlayerCharacter(character) {
        gameState.selectCharacter(character);
        movementSystem.clearAllHighlights();
        if (character.canAct()) {
            movementSystem.showMovableTiles(character);
            // 공격 가능 타일도 함께 표시할 수 있습니다.
            const attackableTiles = gridSystem.getAttackableTiles(character);
            attackableTiles.forEach(t => t.setAttackable(true));
        }
    }
}

export const gameManager = new GameManager();
