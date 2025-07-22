/**
 * 이동 시스템
 * 
 * 캐릭터의 이동, 경로 찾기, 이동 가능 영역 표시 등을 담당합니다.
 * 
 * @module movementSystem
 */

import * as THREE from 'three';
import { gameState } from '../core/gameState.js';
import { gridSystem } from './gridSystem.js';
import { COLORS } from '../core/constants.js';

/**
 * 이동 시스템 클래스
 * 
 * @class MovementSystem
 */
export class MovementSystem {
    constructor() {
        /**
         * 현재 표시 중인 이동 가능 타일들
         * @type {HexTile[]}
         */
        this.highlightedMovableTiles = [];
        
        /**
         * 현재 표시 중인 경로
         * @type {HexTile[]}
         */
        this.currentPath = [];
        
        /**
         * 이동 완료 콜백
         * @type {Function}
         */
        this.onMoveComplete = null;
    }
    
    /**
     * 캐릭터 이동 실행
     * 
     * @param {Character} character - 이동할 캐릭터
     * @param {HexTile} targetTile - 목표 타일
     * @param {Function} [callback] - 이동 완료 콜백
     * @returns {boolean} 이동 시작 성공 여부
     */
    moveCharacter(character, targetTile, callback) {
        // 이동 가능 여부 확인
        if (!this.canMoveTo(character, targetTile)) {
            console.log('해당 타일로 이동할 수 없습니다');
            return false;
        }
        
        // 경로 찾기
        const path = gridSystem.findPath(character.currentTile, targetTile);
        if (path.length === 0) {
            console.log('경로를 찾을 수 없습니다');
            return false;
        }
        
        // 이동 범위 확인
        if (path.length > character.movementRange) {
            console.log('이동 범위를 초과합니다');
            return false;
        }
        
        // 하이라이트 초기화
        this.clearMovementHighlights();
        
        // 경로 따라 이동
        this.moveAlongPath(character, path, () => {
            console.log(`${character.name}이(가) 이동 완료`);
            
            if (this.onMoveComplete) {
                this.onMoveComplete(character);
            }
            
            if (callback) {
                callback();
            }
        });
        
        return true;
    }
    
    /**
     * 경로를 따라 순차적으로 이동
     * 
     * @param {Character} character - 캐릭터
     * @param {HexTile[]} path - 이동 경로
     * @param {Function} [callback] - 완료 콜백
     */
    moveAlongPath(character, path, callback) {
        let currentIndex = 0;
        
        const moveNext = () => {
            if (currentIndex >= path.length) {
                if (callback) callback();
                return;
            }
            
            const nextTile = path[currentIndex];
            currentIndex++;
            
            character.moveTo(nextTile, moveNext);
        };
        
        moveNext();
    }
    
    /**
     * 이동 가능 여부 확인
     * 
     * @param {Character} character - 캐릭터
     * @param {HexTile} targetTile - 목표 타일
     * @returns {boolean} 이동 가능 여부
     */
    canMoveTo(character, targetTile) {
        // 기본 검사
        if (!character || !targetTile) return false;
        if (character.hasMoved) return false;
        if (targetTile.isOccupied()) return false;
        if (targetTile === character.currentTile) return false;
        
        // 경로 존재 여부 확인
        const path = gridSystem.findPath(character.currentTile, targetTile);
        if (path.length === 0) return false;
        
        // 이동 범위 확인
        if (path.length > character.movementRange) return false;
        
        return true;
    }
    
    /**
     * 이동 가능한 타일 표시
     * 
     * @param {Character} character - 캐릭터
     */
    showMovableTiles(character) {
        // 이전 하이라이트 제거
        this.clearMovementHighlights();
        
        // 이동 가능한 타일 찾기
        const movableTiles = gridSystem.getMovableTiles(character);
        
        // 타일 하이라이트
        movableTiles.forEach(tile => {
            tile.setMovable(true);
        });
        
        this.highlightedMovableTiles = movableTiles;
        
        console.log(`${movableTiles.length}개의 이동 가능한 타일 표시`);
    }
    
    /**
     * 경로 미리보기 표시
     * 
     * @param {Character} character - 캐릭터
     * @param {HexTile} targetTile - 목표 타일
     */
    showPathPreview(character, targetTile) {
        // 이전 경로 제거
        this.clearPathPreview();
        
        // 이동 불가능한 경우
        if (!this.canMoveTo(character, targetTile)) {
            return;
        }
        
        // 경로 찾기
        const path = gridSystem.findPath(character.currentTile, targetTile);
        
        // 경로 하이라이트
        path.forEach((tile, index) => {
            // 경로 색상 (점진적으로 밝아짐)
            const intensity = (index + 1) / path.length;
            const color = new THREE.Color(COLORS.TILE_MOVABLE).lerp(
                new THREE.Color(0xffffff), 
                intensity * 0.3
            );
            
            tile.setHighlight(true, color.getHex());
        });
        
        this.currentPath = path;
    }
    
    /**
     * 이동 하이라이트 제거
     */
    clearMovementHighlights() {
        this.highlightedMovableTiles.forEach(tile => {
            tile.setMovable(false);
        });
        this.highlightedMovableTiles = [];
    }
    
    /**
     * 경로 미리보기 제거
     */
    clearPathPreview() {
        this.currentPath.forEach(tile => {
            tile.setHighlight(false);
        });
        this.currentPath = [];
    }
    
    /**
     * 모든 하이라이트 제거
     */
    clearAllHighlights() {
        this.clearMovementHighlights();
        this.clearPathPreview();
        gridSystem.clearAllHighlights();
    }
    
    /**
     * 넉백 (밀어내기) 효과
     * 
     * @param {Character} character - 대상 캐릭터
     * @param {HexTile} fromTile - 밀어내는 방향의 기준 타일
     * @param {number} distance - 밀어낼 거리
     * @param {Function} [callback] - 완료 콜백
     */
    knockback(character, fromTile, distance, callback) {
        // 방향 계산
        const dx = character.currentTile.q - fromTile.q;
        const dr = character.currentTile.r - fromTile.r;
        
        // 정규화
        const magnitude = Math.sqrt(dx * dx + dr * dr);
        const normalizedDx = dx / magnitude;
        const normalizedDr = dr / magnitude;
        
        // 목표 위치 계산
        let targetQ = character.currentTile.q;
        let targetR = character.currentTile.r;
        let actualDistance = 0;
        
        for (let i = 1; i <= distance; i++) {
            const newQ = Math.round(character.currentTile.q + normalizedDx * i);
            const newR = Math.round(character.currentTile.r + normalizedDr * i);
            
            const tile = gridSystem.getTile(newQ, newR);
            
            // 유효한 빈 타일인지 확인
            if (tile && !tile.isOccupied()) {
                targetQ = newQ;
                targetR = newR;
                actualDistance = i;
            } else {
                break; // 장애물이나 맵 끝에 도달
            }
        }
        
        // 실제로 밀려날 타일이 있는 경우
        if (actualDistance > 0) {
            const targetTile = gridSystem.getTile(targetQ, targetR);
            
            // 강제 이동 (이동 제한 무시)
            character.currentTile.removeOccupant();
            character.currentTile = targetTile;
            targetTile.setOccupant(character);
            
            // 애니메이션
            const targetPos = targetTile.getPixelPosition();
            character.setPosition(targetPos.x, targetPos.z);
            
            console.log(`${character.name}이(가) ${actualDistance}칸 밀려났습니다`);
        }
        
        if (callback) callback();
    }
    
    /**
     * 순간이동
     * 
     * @param {Character} character - 캐릭터
     * @param {HexTile} targetTile - 목표 타일
     * @param {Function} [callback] - 완료 콜백
     * @returns {boolean} 순간이동 성공 여부
     */
    teleport(character, targetTile, callback) {
        // 목표 타일 검사
        if (!targetTile || targetTile.isOccupied()) {
            console.log('순간이동 불가: 목표 타일이 점유됨');
            return false;
        }
        
        // 이전 타일에서 제거
        if (character.currentTile) {
            character.currentTile.removeOccupant();
        }
        
        // 새 타일로 이동
        character.currentTile = targetTile;
        targetTile.setOccupant(character);
        
        // 즉시 위치 변경
        const targetPos = targetTile.getPixelPosition();
        character.setPosition(targetPos.x, targetPos.z);
        
        // 순간이동 이펙트 (추후 구현)
        // this.playTeleportEffect(character);
        
        console.log(`${character.name}이(가) 순간이동했습니다`);
        
        if (callback) callback();
        return true;
    }
    
    /**
     * 대시 이동
     * 
     * 직선으로 빠르게 이동
     * @param {Character} character - 캐릭터
     * @param {HexTile} directionTile - 방향을 나타내는 타일
     * @param {number} dashDistance - 대시 거리
     * @param {Function} [callback] - 완료 콜백
     */
    dash(character, directionTile, dashDistance, callback) {
        // 방향 계산
        const dx = directionTile.q - character.currentTile.q;
        const dr = directionTile.r - character.currentTile.r;
        
        // 정규화
        const magnitude = Math.sqrt(dx * dx + dr * dr);
        const normalizedDx = dx / magnitude;
        const normalizedDr = dr / magnitude;
        
        // 대시 경로 찾기
        const dashPath = [];
        for (let i = 1; i <= dashDistance; i++) {
            const q = Math.round(character.currentTile.q + normalizedDx * i);
            const r = Math.round(character.currentTile.r + normalizedDr * i);
            
            const tile = gridSystem.getTile(q, r);
            if (tile && !tile.isOccupied()) {
                dashPath.push(tile);
            } else {
                break; // 장애물 만나면 정지
            }
        }
        
        if (dashPath.length > 0) {
            // 빠른 이동 애니메이션
            this.moveAlongPath(character, dashPath, callback);
            character.hasMoved = true;
        } else {
            console.log('대시할 수 없습니다');
            if (callback) callback();
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const movementSystem = new MovementSystem();