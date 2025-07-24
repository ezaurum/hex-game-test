/**
 * 카메라 컨트롤 시스템
 *
 * 카메라의 이동, 회전, 줌 기능을 관리합니다.
 * 구면 좌표계(Spherical Coordinates)를 사용하여 부드러운 카메라 움직임을 구현합니다.
 *
 * @module cameraControls
 * @tutorial https://threejs.org/docs/#api/en/math/Spherical
 */

import * as THREE from 'three';
import { CAMERA, ANIMATION } from '../core/constants.js';
import { sceneSetup } from '../core/sceneSetup.js';

/**
 * 카메라 컨트롤 클래스
 *
 * @class CameraControls
 */
export class CameraControls {
    constructor() {
        /**
         * 카메라 타겟 위치
         * @type {THREE.Vector3}
         */
        this.target = new THREE.Vector3(0, 0, 0);

        /**
         * 구면 좌표계 정보
         * @type {Object}
         * @tutorial https://en.wikipedia.org/wiki/Spherical_coordinate_system
         */
        this.spherical = {
            radius: 20,           // 카메라와 타겟 사이의 거리
            theta: -Math.PI / 4,  // 수평 각도 (방위각)
            phi: Math.PI / 3,     // 수직 각도 (극각)
        };

        /**
         * 마우스 드래그 상태
         * @type {Object}
         */
        this.dragState = {
            isLeftDragging: false,   // 좌클릭 드래그 (팬)
            isRightDragging: false,  // 우클릭 드래그 (회전)
            lastMouseX: 0,
            lastMouseY: 0,
        };

        /**
         * 카메라 이동 속도 설정
         * @type {Object}
         */
        this.speed = {
            pan: CAMERA.PAN_SPEED,
            rotation: CAMERA.ROTATION_SPEED,
            zoom: CAMERA.ZOOM_SPEED,
        };

        /**
         * 카메라 제한 설정
         * @type {Object}
         */
        this.limits = {
            minRadius: CAMERA.MIN_ZOOM,
            maxRadius: CAMERA.MAX_ZOOM,
            minPhi: 0.1,              // 최소 수직 각도 (거의 수평)
            maxPhi: Math.PI / 2 - 0.1, // 최대 수직 각도 (거의 수직)
        };

        /**
         * 부드러운 이동을 위한 목표값
         * @type {Object}
         */
        this.smoothTarget = {
            position: new THREE.Vector3(0, 0, 0),
            spherical: { ...this.spherical },
        };
    }

    /**
     * 카메라 컨트롤 초기화
     */
    init() {
        // 이벤트 리스너 등록
        this.setupEventListeners();

        // Store the initial target as board center
        this.boardCenterX = this.target.x;
        this.boardCenterZ = this.target.z;

        // Set initial spherical coordinates based on current camera position
        const camera = sceneSetup.camera;
        const dx = camera.position.x - this.target.x;
        const dy = camera.position.y - this.target.y;
        const dz = camera.position.z - this.target.z;


        this.spherical.radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        // Handle the case where radius is 0 or very small
        if (this.spherical.radius < 0.0001) {
            console.warn('Camera too close to target, setting default distance');
            this.spherical.radius = 20;
            this.spherical.phi = Math.PI / 3;
            this.spherical.theta = Math.PI / 4;
        } else {
            // Safely calculate phi to avoid NaN
            const radiusXZ = Math.sqrt(dx * dx + dz * dz);
            this.spherical.phi = Math.atan2(radiusXZ, dy);
            this.spherical.theta = Math.atan2(dz, dx);
        }


        // Copy to smooth target
        this.smoothTarget.spherical = { ...this.spherical };
        
        // Validate spherical values
        if (isNaN(this.spherical.radius) || isNaN(this.smoothTarget.spherical.radius)) {
            console.error('Initial spherical radius is NaN, setting default');
            this.spherical.radius = 20;
            this.smoothTarget.spherical.radius = 20;
        }

    }

    /**
     * Set the game board center for camera to orbit around
     */
    setBoardCenter(x, z) {
        if (isNaN(x) || isNaN(z)) {
            console.error('setBoardCenter received NaN values!', { x, z });
            return;
        }
        this.boardCenterX = x;
        this.boardCenterZ = z;
        this.target.set(x, 0, z);
        this.smoothTarget.position.set(x, 0, z);
    }

    /**
     * 이벤트 리스너 설정
     */
    setupEventListeners() {
        const canvas = sceneSetup.renderer.domElement;

        // 마우스 다운
        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));

        // 마우스 이동
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // 마우스 업
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // 마우스 휠
        canvas.addEventListener('wheel', (e) => this.onMouseWheel(e));

        // 컨텍스트 메뉴 방지
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // 키보드 이벤트 (+/- 줌)
        window.addEventListener('keydown', (e) => this.onKeyDown(e));

        // 터치 이벤트 (모바일 지원)
        canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    /**
     * 마우스 다운 이벤트 처리
     *
     * @param {MouseEvent} event
     */
    onMouseDown(event) {
        if (event.button === 0) {
            if (event.shiftKey) {
                // Shift + 좌클릭: 회전 시작
                this.dragState.isRightDragging = true;
            } else {
                // 좌클릭: 팬 시작
                this.dragState.isLeftDragging = true;
            }
        }

        this.dragState.lastMouseX = event.clientX;
        this.dragState.lastMouseY = event.clientY;
    }

    /**
     * 마우스 이동 이벤트 처리
     *
     * @param {MouseEvent} event
     */
    onMouseMove(event) {
        const deltaX = event.clientX - this.dragState.lastMouseX;
        const deltaY = event.clientY - this.dragState.lastMouseY;

        if (this.dragState.isLeftDragging && !event.shiftKey) {
            // 좌클릭 드래그 (Shift 없이): 카메라 팬
            this.pan(deltaX, deltaY);
        } else if (this.dragState.isRightDragging || (this.dragState.isLeftDragging && event.shiftKey)) {
            // Shift + 좌클릭 드래그: 카메라 회전
            this.rotate(deltaX, deltaY);
        }

        this.dragState.lastMouseX = event.clientX;
        this.dragState.lastMouseY = event.clientY;
    }

    /**
     * 마우스 업 이벤트 처리
     *
     * @param {MouseEvent} event
     */
    onMouseUp(event) {
        if (event.button === 0) {
            this.dragState.isLeftDragging = false;
            this.dragState.isRightDragging = false;
        }
    }

    /**
     * 마우스 휠 이벤트 처리
     *
     * @param {WheelEvent} event
     */
    onMouseWheel(event) {
        event.preventDefault();

        // deltaY가 0이거나 NaN인 경우 처리
        if (!event.deltaY || isNaN(event.deltaY)) {
            return;
        }

        // deltaY를 정규화하여 줌 속도 계산
        // 브라우저마다 deltaY 값이 다를 수 있으므로 정규화
        const normalizedDelta = Math.sign(event.deltaY) * Math.min(Math.abs(event.deltaY) / 100, 1);
        
        // NaN 체크
        if (isNaN(normalizedDelta)) {
            console.error('Normalized delta is NaN', { deltaY: event.deltaY, normalizedDelta });
            return;
        }
        
        this.zoom(normalizedDelta);
    }

    /**
     * 키보드 이벤트 처리
     *
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
        if (event.key === '+' || event.key === '=') {
            // + 키: 줌 인
            this.zoom(-1);
        } else if (event.key === '-' || event.key === '_') {
            // - 키: 줌 아웃
            this.zoom(1);
        }
    }

    /**
     * 카메라 팬 (좌우상하 이동)
     *
     * @param {number} deltaX - X축 이동량
     * @param {number} deltaY - Y축 이동량
     */
    pan(deltaX, deltaY) {
        const camera = sceneSetup.camera;

        // 카메라의 로컬 좌표계에서 이동 방향 계산
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();

        camera.getWorldDirection(up);
        right.crossVectors(up, camera.up).normalize();
        up.crossVectors(right, camera.getWorldDirection(new THREE.Vector3())).normalize();

        // 이동량 계산
        const panSpeed = this.speed.pan;
        const moveX = -deltaX * panSpeed;
        const moveY = deltaY * panSpeed;

        // 타겟 위치 업데이트 - 현재 타겟이 유효한지 확인
        if (!isNaN(this.target.x) && !isNaN(this.target.y) && !isNaN(this.target.z)) {
            this.smoothTarget.position.copy(this.target);
            this.smoothTarget.position.addScaledVector(right, moveX);
            this.smoothTarget.position.addScaledVector(up, moveY);
        }
    }

    /**
     * 카메라 회전
     *
     * @param {number} deltaX - X축 회전량
     * @param {number} deltaY - Y축 회전량
     */
    rotate(deltaX, deltaY) {
        // 회전 각도 계산
        const rotationSpeed = this.speed.rotation;

        // 수평 회전 (theta)
        this.smoothTarget.spherical.theta -= deltaX * rotationSpeed;

        // 수직 회전 (phi) - 제한 적용
        this.smoothTarget.spherical.phi += deltaY * rotationSpeed;
        this.smoothTarget.spherical.phi = Math.max(
            this.limits.minPhi,
            Math.min(this.limits.maxPhi, this.smoothTarget.spherical.phi)
        );
    }

    /**
     * 카메라 줌
     *
     * @param {number} delta - 줌 방향 (-1 또는 1)
     */
    zoom(delta) {
        // NaN 체크
        if (isNaN(this.smoothTarget.spherical.radius)) {
            console.warn('smoothTarget.spherical.radius is NaN, resetting to current radius');
            this.smoothTarget.spherical.radius = this.spherical.radius;
        }
        
        // 줌 거리 계산
        const zoomSpeed = this.speed.zoom;
        const currentRadius = this.smoothTarget.spherical.radius;
        const zoomAmount = delta * zoomSpeed * currentRadius * 0.1;
        
        // NaN 체크
        if (isNaN(zoomAmount)) {
            console.error('Zoom amount is NaN', { delta, zoomSpeed, currentRadius });
            return;
        }
        
        this.smoothTarget.spherical.radius += zoomAmount;

        // 줌 제한 적용
        this.smoothTarget.spherical.radius = Math.max(
            this.limits.minRadius,
            Math.min(this.limits.maxRadius, this.smoothTarget.spherical.radius)
        );
    }

    /**
     * 카메라 위치 업데이트
     *
     * 구면 좌표를 카테시안 좌표로 변환하여 카메라 위치를 설정합니다.
     */
    updateCameraPosition() {
        const camera = sceneSetup.camera;

        // 부드러운 이동을 위한 보간
        const smoothness = ANIMATION.CAMERA_SMOOTHNESS || 0.1;

        // 타겟 위치 보간 - NaN 체크
        if (!isNaN(this.smoothTarget.position.x) && !isNaN(this.smoothTarget.position.y) && !isNaN(this.smoothTarget.position.z)) {
            // Store current values before lerp
            const beforeLerp = { x: this.target.x, y: this.target.y, z: this.target.z };
            this.target.lerp(this.smoothTarget.position, smoothness);
            // Check if lerp introduced NaN
            if (isNaN(this.target.x) || isNaN(this.target.y) || isNaN(this.target.z)) {
                console.error('Lerp introduced NaN!', {
                    before: beforeLerp,
                    after: this.target,
                    smoothTarget: this.smoothTarget.position,
                    smoothness
                });
                // Restore previous values
                this.target.set(beforeLerp.x, beforeLerp.y, beforeLerp.z);
            }
        }

        // 구면 좌표 보간 - NaN 체크
        if (!isNaN(this.smoothTarget.spherical.radius) && !isNaN(this.smoothTarget.spherical.theta) && !isNaN(this.smoothTarget.spherical.phi)) {
            this.spherical.radius += (this.smoothTarget.spherical.radius - this.spherical.radius) * smoothness;
            this.spherical.theta += (this.smoothTarget.spherical.theta - this.spherical.theta) * smoothness;
            this.spherical.phi += (this.smoothTarget.spherical.phi - this.spherical.phi) * smoothness;
        } else {
            console.error('Smooth target spherical has NaN!', this.smoothTarget.spherical);
        }

        // Clamp phi to prevent camera flipping
        this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));

        // 구면 좌표를 카테시안 좌표로 변환
        const x = this.spherical.radius * Math.sin(this.spherical.phi) * Math.cos(this.spherical.theta);
        const y = this.spherical.radius * Math.cos(this.spherical.phi);
        const z = this.spherical.radius * Math.sin(this.spherical.phi) * Math.sin(this.spherical.theta);

        // Check for NaN values before setting camera position
        if (isNaN(x) || isNaN(y) || isNaN(z) || 
            isNaN(this.target.x) || isNaN(this.target.y) || isNaN(this.target.z)) {
            console.error('NaN detected in camera update!', {
                target: this.target,
                xyz: { x, y, z },
                spherical: this.spherical
            });
            return;
        }
        
        // 카메라 위치 설정
        camera.position.set(
            this.target.x + x,
            this.target.y + y,
            this.target.z + z
        );

        // 카메라가 타겟을 바라보도록 설정
        camera.lookAt(this.target);
    }

    /**
     * 특정 위치로 카메라 이동
     *
     * @param {THREE.Vector3} position - 목표 위치
     * @param {number} [duration=1000] - 이동 시간 (밀리초)
     */
    moveTo(position, duration = 1000) {
        const startPosition = this.target.clone();
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 이징 함수 적용
            const eased = this.easeInOutCubic(progress);

            // 위치 보간
            this.target.lerpVectors(startPosition, position, eased);
            this.smoothTarget.position.copy(this.target);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * 캐릭터에 포커스
     *
     * @param {Character} character - 포커스할 캐릭터
     * @param {number} [duration=500] - 이동 시간
     */
    focusOnCharacter(character, duration = 500) {
        if (!character || !character.group) return;

        const targetPosition = character.group.position.clone();
        this.moveTo(targetPosition, duration);
    }

    /**
     * 전체 맵 보기
     *
     * @param {number} [duration=1000] - 이동 시간
     */
    viewEntireMap(duration = 1000) {
        // 맵 중앙으로 이동
        const centerPosition = new THREE.Vector3(0, 0, 0);
        this.moveTo(centerPosition, duration);

        // 적절한 거리로 줌 아웃
        const startRadius = this.spherical.radius;
        const targetRadius = 30;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const eased = this.easeInOutCubic(progress);
            this.smoothTarget.spherical.radius = startRadius + (targetRadius - startRadius) * eased;

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * 이징 함수 (ease-in-out-cubic)
     *
     * @param {number} t - 진행도 (0-1)
     * @returns {number} 이징 적용된 값
     */
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * 터치 이벤트 처리 (모바일)
     */

    /**
     * 터치 시작
     * @param {TouchEvent} event
     */
    onTouchStart(event) {
        if (event.touches.length === 1) {
            // 단일 터치: 회전
            this.dragState.isRightDragging = true;
            this.dragState.lastMouseX = event.touches[0].clientX;
            this.dragState.lastMouseY = event.touches[0].clientY;
        } else if (event.touches.length === 2) {
            // 두 손가락: 줌
            this.handlePinchStart(event);
        }
    }

    /**
     * 터치 이동
     * @param {TouchEvent} event
     */
    onTouchMove(event) {
        event.preventDefault();

        if (event.touches.length === 1 && this.dragState.isRightDragging) {
            const deltaX = event.touches[0].clientX - this.dragState.lastMouseX;
            const deltaY = event.touches[0].clientY - this.dragState.lastMouseY;

            this.rotate(deltaX, deltaY);

            this.dragState.lastMouseX = event.touches[0].clientX;
            this.dragState.lastMouseY = event.touches[0].clientY;
        } else if (event.touches.length === 2) {
            this.handlePinchMove(event);
        }
    }

    /**
     * 터치 종료
     * @param {TouchEvent} event
     */
    onTouchEnd(event) {
        this.dragState.isRightDragging = false;
    }

    /**
     * 핀치 줌 처리
     */
    lastPinchDistance = 0;

    handlePinchStart(event) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        this.lastPinchDistance = Math.sqrt(dx * dx + dy * dy);
    }

    handlePinchMove(event) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const delta = distance - this.lastPinchDistance;
        this.zoom(-delta * 0.01);

        this.lastPinchDistance = distance;
    }

    /**
     * 카메라 상태 초기화
     */
    reset() {
        this.target.set(0, 0, 0);
        this.smoothTarget.position.set(0, 0, 0);
        this.spherical = {
            radius: 20,
            theta: Math.PI / 4,
            phi: Math.PI / 3,
        };
        this.smoothTarget.spherical = { ...this.spherical };
        this.updateCameraPosition();
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const cameraControls = new CameraControls();
