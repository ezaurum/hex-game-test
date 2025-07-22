/**
 * 육각형 타일 클래스
 * 
 * 게임 보드를 구성하는 육각형 타일을 나타내는 클래스입니다.
 * 큐브 좌표계(Cube Coordinates)를 사용하여 육각형 그리드를 구현합니다.
 * 
 * @module HexTile
 * @tutorial https://www.redblobgames.com/grids/hexagons/
 */

import * as THREE from 'three';
import { HEX_SIZE, COLORS } from '../core/constants.js';

/**
 * 육각형 타일 클래스
 * 
 * 큐브 좌표계를 사용하며, q + r + s = 0 관계를 만족합니다.
 * 
 * @class HexTile
 * @tutorial https://www.redblobgames.com/grids/hexagons/#coordinates-cube
 */
export class HexTile {
    /**
     * @param {number} q - 큐브 좌표계의 q값
     * @param {number} r - 큐브 좌표계의 r값
     */
    constructor(q, r) {
        /**
         * 큐브 좌표 q
         * @type {number}
         */
        this.q = q;
        
        /**
         * 큐브 좌표 r
         * @type {number}
         */
        this.r = r;
        
        /**
         * 큐브 좌표 s (자동 계산)
         * q + r + s = 0 관계를 만족해야 함
         * @type {number}
         */
        this.s = -q - r;
        
        /**
         * 타일 위의 캐릭터
         * @type {Character|null}
         */
        this.occupant = null;
        
        /**
         * Three.js 메시 객체 (타일 본체)
         * @type {THREE.Mesh}
         */
        this.mesh = null;
        
        /**
         * Three.js 메시 객체 (타일 테두리)
         * @type {THREE.LineSegments}
         */
        this.borderMesh = null;
        
        /**
         * 원래 색상 (하이라이트 후 복원용)
         * @type {number}
         */
        this.originalColor = COLORS.TILE_DEFAULT;
        
        /**
         * 타일 상태 플래그
         * @type {Object}
         */
        this.state = {
            isHighlighted: false,
            isMovable: false,
            isAttackable: false,
        };
        
        // 3D 메시 생성
        this.createMesh();
    }
    
    /**
     * 육각형 3D 메시 생성
     * 
     * Flat-top 육각형을 생성합니다.
     * @tutorial https://threejs.org/docs/#api/en/geometries/CylinderGeometry
     */
    createMesh() {
        // 육각형 지오메트리 생성
        // CylinderGeometry를 사용하여 6각형 기둥 생성
        const geometry = new THREE.CylinderGeometry(
            HEX_SIZE,      // 상단 반지름
            HEX_SIZE,      // 하단 반지름
            0.1,           // 높이
            6,             // 면의 수 (6각형)
            1              // 높이 세그먼트
        );
        
        // 재질 생성
        const material = new THREE.MeshPhongMaterial({
            color: this.originalColor,
            flatShading: true,        // 플랫 셰이딩 (각진 느낌)
            shininess: 30,            // 광택
            specular: 0x111111,       // 반사광 색상
        });
        
        // 메시 생성
        this.mesh = new THREE.Mesh(geometry, material);
        
        // 그림자 설정
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // 위치 설정 (큐브 좌표를 픽셀 좌표로 변환)
        const position = this.getPixelPosition();
        this.mesh.position.set(position.x, 0, position.z);
        
        // 육각형이 평평하게 놓이도록 회전
        this.mesh.rotation.y = Math.PI / 6;
        
        // 타일에 대한 참조 저장 (레이캐스팅용)
        this.mesh.userData.tile = this;
        
        // 테두리 생성
        this.createBorder();
    }
    
    /**
     * 타일 테두리 생성
     * 
     * EdgeGeometry를 사용하여 육각형 테두리를 생성합니다.
     */
    createBorder() {
        // 테두리 지오메트리 생성
        const edges = new THREE.EdgesGeometry(this.mesh.geometry);
        
        // 테두리 재질 (선)
        const lineMaterial = new THREE.LineBasicMaterial({
            color: COLORS.TILE_BORDER,
            linewidth: 2,  // 참고: WebGL에서는 대부분 1픽셀로 제한됨
        });
        
        // 테두리 메시 생성
        this.borderMesh = new THREE.LineSegments(edges, lineMaterial);
        
        // 테두리 위치 설정 (타일보다 약간 위)
        this.borderMesh.position.copy(this.mesh.position);
        this.borderMesh.position.y = 0.06;
        this.borderMesh.rotation.y = Math.PI / 6;
    }
    
    /**
     * 큐브 좌표를 픽셀 좌표로 변환
     * 
     * Flat-top 육각형 레이아웃 사용
     * @returns {{x: number, z: number}} 픽셀 좌표
     * @tutorial https://www.redblobgames.com/grids/hexagons/#hex-to-pixel
     */
    getPixelPosition() {
        const x = HEX_SIZE * (3/2 * this.q);
        const z = HEX_SIZE * (Math.sqrt(3)/2 * this.q + Math.sqrt(3) * this.r);
        return { x, z };
    }
    
    /**
     * 타일 하이라이트
     * 
     * @param {boolean} highlight - 하이라이트 여부
     * @param {number} [color] - 하이라이트 색상 (선택적)
     */
    setHighlight(highlight, color = COLORS.TILE_HOVER) {
        this.state.isHighlighted = highlight;
        
        if (highlight) {
            this.mesh.material.color.setHex(color);
            // 약간 위로 이동하여 강조
            this.mesh.position.y = 0.1;
            this.borderMesh.position.y = 0.16;
        } else {
            // 원래 색상으로 복원
            this.mesh.material.color.setHex(this.originalColor);
            this.mesh.position.y = 0;
            this.borderMesh.position.y = 0.06;
        }
    }
    
    /**
     * 이동 가능 타일 표시
     * 
     * @param {boolean} movable - 이동 가능 여부
     */
    setMovable(movable) {
        this.state.isMovable = movable;
        
        if (movable) {
            this.originalColor = COLORS.TILE_MOVABLE;
            this.mesh.material.color.setHex(COLORS.TILE_MOVABLE);
        } else {
            this.originalColor = COLORS.TILE_DEFAULT;
            this.mesh.material.color.setHex(COLORS.TILE_DEFAULT);
        }
    }
    
    /**
     * 공격 가능 타일 표시
     * 
     * @param {boolean} attackable - 공격 가능 여부
     */
    setAttackable(attackable) {
        this.state.isAttackable = attackable;
        
        if (attackable) {
            this.originalColor = COLORS.TILE_ATTACKABLE;
            this.mesh.material.color.setHex(COLORS.TILE_ATTACKABLE);
        } else {
            this.originalColor = COLORS.TILE_DEFAULT;
            this.mesh.material.color.setHex(COLORS.TILE_DEFAULT);
        }
    }
    
    /**
     * 타일 점유 상태 확인
     * 
     * @returns {boolean} 점유 여부
     */
    isOccupied() {
        return this.occupant !== null;
    }
    
    /**
     * 캐릭터 배치
     * 
     * @param {Character} character - 배치할 캐릭터
     */
    setOccupant(character) {
        this.occupant = character;
        
        if (character) {
            // 캐릭터 위치를 타일 위로 설정
            const pos = this.getPixelPosition();
            character.setPosition(pos.x, pos.z);
        }
    }
    
    /**
     * 캐릭터 제거
     */
    removeOccupant() {
        this.occupant = null;
    }
    
    /**
     * 다른 타일과의 거리 계산
     * 
     * 큐브 좌표계에서의 맨해튼 거리 사용
     * @param {HexTile} other - 다른 타일
     * @returns {number} 타일 간 거리
     * @tutorial https://www.redblobgames.com/grids/hexagons/#distances
     */
    distanceTo(other) {
        return (Math.abs(this.q - other.q) + 
                Math.abs(this.q + this.r - other.q - other.r) + 
                Math.abs(this.r - other.r)) / 2;
    }
    
    /**
     * 인접한 타일인지 확인
     * 
     * @param {HexTile} other - 다른 타일
     * @returns {boolean} 인접 여부
     */
    isNeighbor(other) {
        return this.distanceTo(other) === 1;
    }
    
    /**
     * 타일 정보 문자열 반환
     * 
     * @returns {string} 타일 좌표 정보
     */
    toString() {
        return `HexTile(q:${this.q}, r:${this.r}, s:${this.s})`;
    }
    
    /**
     * 타일 리소스 정리
     */
    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
        }
        
        if (this.borderMesh) {
            this.borderMesh.geometry.dispose();
            this.borderMesh.material.dispose();
        }
    }
}