/**
 * 육각형 그리드 시스템
 * 
 * 게임 보드를 생성하고 관리하는 시스템입니다.
 * 육각형 타일의 생성, 이웃 관계, 거리 계산 등을 담당합니다.
 * 
 * @module gridSystem
 * @tutorial https://www.redblobgames.com/grids/hexagons/
 */

import { GRID_WIDTH, GRID_HEIGHT } from '../core/constants.js';
import { HexTile } from '../entities/HexTile.js';
import { gameState } from '../core/gameState.js';
import { sceneSetup } from '../core/sceneSetup.js';

/**
 * 그리드 시스템 클래스
 * 
 * @class GridSystem
 */
export class GridSystem {
    constructor() {
        /**
         * 육각형 타일 2차원 배열
         * @type {HexTile[][]}
         */
        this.hexGrid = [];
        
        /**
         * 모든 타일의 플랫 배열
         * @type {HexTile[]}
         */
        this.allTiles = [];
        
        /**
         * 타일 맵 (빠른 검색용)
         * key: "q,r" 형식의 문자열
         * @type {Map<string, HexTile>}
         */
        this.tileMap = new Map();
    }
    
    /**
     * 육각형 그리드 생성
     * 
     * 오프셋 좌표를 큐브 좌표로 변환하여 육각형 그리드를 생성합니다.
     * @tutorial https://www.redblobgames.com/grids/hexagons/#conversions-offset
     */
    createGrid() {
        
        // 그리드 중심 오프셋 계산
        const offsetX = -GRID_WIDTH / 2;
        const offsetZ = -GRID_HEIGHT / 2;
        
        // 그리드 생성
        for (let row = 0; row < GRID_HEIGHT; row++) {
            this.hexGrid[row] = [];
            
            for (let col = 0; col < GRID_WIDTH; col++) {
                // 오프셋 좌표를 큐브 좌표로 변환
                // "odd-r" 레이아웃 사용
                const q = col + offsetX;
                const r = row + offsetZ - Math.floor(col / 2);
                
                // 타일 생성
                const tile = new HexTile(q, r);
                
                // 배열에 추가
                this.hexGrid[row][col] = tile;
                this.allTiles.push(tile);
                
                // 맵에 추가 (빠른 검색용)
                this.tileMap.set(`${q},${r}`, tile);
                
                // 씬에 추가
                sceneSetup.scene.add(tile.mesh);
                sceneSetup.scene.add(tile.borderMesh);
            }
        }
        
        // 게임 상태에 그리드 저장
        gameState.hexGrid = this.hexGrid;
        
    }
    
    /**
     * 좌표로 타일 가져오기
     * 
     * @param {number} q - 큐브 좌표 q
     * @param {number} r - 큐브 좌표 r
     * @returns {HexTile|null} 해당 좌표의 타일
     */
    getTile(q, r) {
        return this.tileMap.get(`${q},${r}`) || null;
    }
    
    /**
     * 타일의 이웃 타일들 가져오기
     * 
     * 육각형의 6방향 이웃을 반환합니다.
     * @param {HexTile} tile - 중심 타일
     * @returns {HexTile[]} 이웃 타일 배열
     * @tutorial https://www.redblobgames.com/grids/hexagons/#neighbors
     */
    getNeighbors(tile) {
        const neighbors = [];
        
        // 육각형의 6방향 오프셋
        const directions = [
            { q: 1, r: 0 },   // 오른쪽
            { q: 1, r: -1 },  // 오른쪽 위
            { q: 0, r: -1 },  // 왼쪽 위
            { q: -1, r: 0 },  // 왼쪽
            { q: -1, r: 1 },  // 왼쪽 아래
            { q: 0, r: 1 },   // 오른쪽 아래
        ];
        
        for (const dir of directions) {
            const neighbor = this.getTile(tile.q + dir.q, tile.r + dir.r);
            if (neighbor) {
                neighbors.push(neighbor);
            }
        }
        
        return neighbors;
    }
    
    /**
     * 특정 범위 내의 타일들 가져오기
     * 
     * @param {HexTile} center - 중심 타일
     * @param {number} range - 범위 (타일 수)
     * @returns {HexTile[]} 범위 내 타일 배열
     */
    getTilesInRange(center, range) {
        const tilesInRange = [];
        
        // 큐브 좌표 기반 범위 검색
        for (let q = -range; q <= range; q++) {
            for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
                const tile = this.getTile(center.q + q, center.r + r);
                if (tile) {
                    tilesInRange.push(tile);
                }
            }
        }
        
        return tilesInRange;
    }
    
    /**
     * 두 타일 간의 경로 찾기
     * 
     * A* 알고리즘을 사용한 경로 탐색
     * @param {HexTile} start - 시작 타일
     * @param {HexTile} end - 목표 타일
     * @param {boolean} [ignoreOccupants=false] - 점유된 타일 무시 여부
     * @returns {HexTile[]} 경로 배열 (시작 타일 제외)
     * @tutorial https://www.redblobgames.com/pathfinding/a-star/introduction.html
     */
    findPath(start, end, ignoreOccupants = false) {
        if (start === end) return [];
        
        // A* 알고리즘 구현
        const openSet = [start];
        const closedSet = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(start, 0);
        fScore.set(start, start.distanceTo(end));
        
        while (openSet.length > 0) {
            // f값이 가장 낮은 노드 선택
            let current = openSet[0];
            let currentIndex = 0;
            
            for (let i = 1; i < openSet.length; i++) {
                if (fScore.get(openSet[i]) < fScore.get(current)) {
                    current = openSet[i];
                    currentIndex = i;
                }
            }
            
            // 목표 도달
            if (current === end) {
                const path = [];
                let temp = current;
                
                while (cameFrom.has(temp)) {
                    path.unshift(temp);
                    temp = cameFrom.get(temp);
                }
                
                return path;
            }
            
            // 현재 노드를 처리
            openSet.splice(currentIndex, 1);
            closedSet.add(current);
            
            // 이웃 노드 탐색
            const neighbors = this.getNeighbors(current);
            
            for (const neighbor of neighbors) {
                if (closedSet.has(neighbor)) continue;
                
                // 점유된 타일 체크
                if (!ignoreOccupants && neighbor.isOccupied() && neighbor !== end) {
                    continue;
                }
                
                const tentativeGScore = gScore.get(current) + 1;
                
                if (!openSet.includes(neighbor)) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(neighbor)) {
                    continue;
                }
                
                // 더 나은 경로 발견
                cameFrom.set(neighbor, current);
                gScore.set(neighbor, tentativeGScore);
                fScore.set(neighbor, tentativeGScore + neighbor.distanceTo(end));
            }
        }
        
        // 경로를 찾을 수 없음
        return [];
    }
    
    /**
     * 직선 상의 타일들 가져오기
     * 
     * 두 타일 사이의 직선 경로상의 모든 타일을 반환합니다.
     * @param {HexTile} start - 시작 타일
     * @param {HexTile} end - 끝 타일
     * @returns {HexTile[]} 직선 상의 타일들
     * @tutorial https://www.redblobgames.com/grids/hexagons/#line-drawing
     */
    getLine(start, end) {
        const distance = start.distanceTo(end);
        const tiles = [];
        
        for (let i = 0; i <= distance; i++) {
            const t = i / distance;
            
            // 선형 보간
            const q = Math.round(start.q * (1 - t) + end.q * t);
            const r = Math.round(start.r * (1 - t) + end.r * t);
            
            const tile = this.getTile(q, r);
            if (tile) {
                tiles.push(tile);
            }
        }
        
        return tiles;
    }
    
    /**
     * 시야선 확인
     * 
     * 두 타일 사이에 장애물이 있는지 확인합니다.
     * @param {HexTile} from - 시작 타일
     * @param {HexTile} to - 목표 타일
     * @returns {boolean} 시야선이 확보되면 true
     */
    hasLineOfSight(from, to) {
        const line = this.getLine(from, to);
        
        // 시작과 끝 타일을 제외하고 확인
        for (let i = 1; i < line.length - 1; i++) {
            if (line[i].isOccupied()) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 이동 가능한 타일 찾기
     * 
     * 캐릭터가 이동할 수 있는 모든 타일을 찾습니다.
     * @param {Character} character - 캐릭터
     * @returns {HexTile[]} 이동 가능한 타일들
     */
    getMovableTiles(character) {
        if (!character || !character.currentTile) return [];
        
        const movableTiles = [];
        // 남은 이동 범위 계산
        const remainingMovement = character.movementRange - character.movedDistance;
        const tilesInRange = this.getTilesInRange(character.currentTile, remainingMovement);
        
        for (const tile of tilesInRange) {
            // 자기 자신 타일 제외
            if (tile === character.currentTile) continue;
            
            // 점유된 타일 제외
            if (tile.isOccupied()) continue;
            
            // 경로가 있는지 확인
            const path = this.findPath(character.currentTile, tile);
            if (path.length > 0 && path.length <= remainingMovement) {
                movableTiles.push(tile);
            }
        }
        
        return movableTiles;
    }
    
    /**
     * 공격 가능한 타일 찾기
     * 
     * 캐릭터가 공격할 수 있는 모든 타일을 찾습니다.
     * @param {Character} character - 캐릭터
     * @returns {HexTile[]} 공격 가능한 타일들
     */
    getAttackableTiles(character) {
        if (!character || !character.currentTile) return [];
        
        const attackableTiles = [];
        const tilesInRange = this.getTilesInRange(character.currentTile, character.attackRange);
        
        for (const tile of tilesInRange) {
            // 자기 자신 타일 제외
            if (tile === character.currentTile) continue;
            
            // 적이 있는 타일만
            if (tile.isOccupied() && tile.occupant.type !== character.type) {
                attackableTiles.push(tile);
            }
        }
        
        return attackableTiles;
    }
    
    /**
     * 모든 타일 하이라이트 초기화
     */
    clearAllHighlights() {
        for (const tile of this.allTiles) {
            tile.setHighlight(false);
            tile.setMovable(false);
            tile.setAttackable(false);
        }
    }
    
    /**
     * 그리드 리소스 정리
     */
    dispose() {
        for (const tile of this.allTiles) {
            tile.dispose();
            sceneSetup.scene.remove(tile.mesh);
            sceneSetup.scene.remove(tile.borderMesh);
        }
        
        this.hexGrid = [];
        this.allTiles = [];
        this.tileMap.clear();
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const gridSystem = new GridSystem();