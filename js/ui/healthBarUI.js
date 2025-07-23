/**
 * 2D 체력바 UI 시스템
 * 
 * 3D 캐릭터의 위치를 2D 화면 좌표로 변환하여
 * HTML/CSS 기반의 체력바를 표시합니다.
 * 
 * @module healthBarUI
 */

import * as THREE from 'three';
import { sceneSetup } from '../core/sceneSetup.js';

/**
 * 체력바 UI 관리 클래스
 * 
 * @class HealthBarUI
 */
export class HealthBarUI {
    constructor() {
        /**
         * 체력바 컨테이너 요소
         * @type {HTMLElement}
         */
        this.container = null;
        
        /**
         * 캐릭터별 체력바 요소 맵
         * @type {Map<number, HTMLElement>}
         */
        this.healthBars = new Map();
        
        /**
         * Three.js Vector3 재사용을 위한 임시 변수
         * @type {THREE.Vector3}
         */
        this.tempVector = new THREE.Vector3();
    }
    
    /**
     * 체력바 UI 초기화
     */
    init() {
        // 체력바 컨테이너 생성
        this.container = document.createElement('div');
        this.container.id = 'health-bars-container';
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 100;
        `;
        document.body.appendChild(this.container);
        
        // CSS 스타일 추가
        this.addStyles();
    }
    
    /**
     * CSS 스타일 추가
     */
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .character-health-bar {
                position: absolute;
                width: 60px;
                height: 8px;
                background-color: rgba(0, 0, 0, 0.7);
                border: 1px solid #333;
                border-radius: 4px;
                transform: translate(-50%, -100%);
                transition: opacity 0.3s;
            }
            
            .character-health-bar.hidden {
                opacity: 0;
            }
            
            .health-bar-fill {
                height: 100%;
                border-radius: 3px;
                transition: width 0.3s ease-out;
                position: relative;
            }
            
            .health-bar-fill::after {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 50%);
                border-radius: 3px;
            }
            
            .health-bar-fill.high {
                background-color: #4CAF50;
            }
            
            .health-bar-fill.medium {
                background-color: #FFC107;
            }
            
            .health-bar-fill.low {
                background-color: #F44336;
            }
            
            .character-name {
                position: absolute;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                font-size: 12px;
                color: white;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                white-space: nowrap;
                margin-bottom: 2px;
                font-family: Arial, sans-serif;
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 캐릭터의 체력바 생성
     * 
     * @param {Character} character - 캐릭터 객체
     */
    createHealthBar(character) {
        // 체력바 요소 생성
        const healthBar = document.createElement('div');
        healthBar.className = 'character-health-bar';
        healthBar.innerHTML = `
            <div class="character-name">${character.name}</div>
            <div class="health-bar-fill high" style="width: 100%"></div>
        `;
        
        this.container.appendChild(healthBar);
        this.healthBars.set(character.id, healthBar);
        
        // 초기 업데이트
        this.updateHealthBar(character);
    }
    
    /**
     * 캐릭터의 체력바 업데이트
     * 
     * @param {Character} character - 캐릭터 객체
     */
    updateHealthBar(character) {
        const healthBar = this.healthBars.get(character.id);
        if (!healthBar) return;
        
        // 체력 비율 계산
        const healthPercent = character.health / character.maxHealth;
        const fill = healthBar.querySelector('.health-bar-fill');
        
        // 체력바 너비 업데이트
        fill.style.width = `${Math.max(0, healthPercent * 100)}%`;
        
        // 체력에 따른 색상 클래스 변경
        fill.className = 'health-bar-fill';
        if (healthPercent > 0.6) {
            fill.classList.add('high');
        } else if (healthPercent > 0.3) {
            fill.classList.add('medium');
        } else {
            fill.classList.add('low');
        }
        
        // 죽은 캐릭터는 체력바 숨김
        if (character.health <= 0) {
            healthBar.classList.add('hidden');
        }
    }
    
    /**
     * 캐릭터의 체력바 위치 업데이트
     * 
     * @param {Character} character - 캐릭터 객체
     */
    updateHealthBarPosition(character) {
        const healthBar = this.healthBars.get(character.id);
        if (!healthBar || !character.isAlive()) return;
        
        const camera = sceneSetup.camera;
        const renderer = sceneSetup.renderer;
        
        if (!camera || !renderer) return;
        
        // 캐릭터의 월드 위치 가져오기 (머리 위)
        this.tempVector.setFromMatrixPosition(character.group.matrixWorld);
        this.tempVector.y += 2; // 캐릭터 머리 위로 조정
        
        // 3D 좌표를 2D 화면 좌표로 변환
        this.tempVector.project(camera);
        
        // NDC 좌표를 화면 좌표로 변환
        const x = (this.tempVector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
        const y = (-this.tempVector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
        
        // 카메라 뒤에 있거나 화면 밖에 있는 경우 숨김
        if (this.tempVector.z > 1 || x < -100 || x > renderer.domElement.clientWidth + 100 ||
            y < -100 || y > renderer.domElement.clientHeight + 100) {
            healthBar.style.display = 'none';
        } else {
            healthBar.style.display = 'block';
            healthBar.style.left = `${x}px`;
            healthBar.style.top = `${y}px`;
        }
    }
    
    /**
     * 모든 체력바 위치 업데이트
     * 
     * @param {Character[]} characters - 캐릭터 배열
     */
    updateAllPositions(characters) {
        characters.forEach(character => {
            this.updateHealthBarPosition(character);
        });
    }
    
    /**
     * 캐릭터의 체력바 제거
     * 
     * @param {Character} character - 캐릭터 객체
     */
    removeHealthBar(character) {
        const healthBar = this.healthBars.get(character.id);
        if (healthBar) {
            healthBar.remove();
            this.healthBars.delete(character.id);
        }
    }
    
    /**
     * 모든 체력바 제거
     */
    clearAll() {
        this.healthBars.forEach(healthBar => healthBar.remove());
        this.healthBars.clear();
    }
    
    /**
     * UI 시스템 정리
     */
    destroy() {
        this.clearAll();
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const healthBarUI = new HealthBarUI();