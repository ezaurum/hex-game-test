/**
 * Three.js 씬 설정 모듈
 * 
 * 3D 렌더링을 위한 Three.js 씬, 카메라, 렌더러, 조명 등을 설정합니다.
 * 
 * @module sceneSetup
 * @tutorial https://threejs.org/docs/#manual/introduction/Creating-a-scene
 */

import { COLORS, CAMERA, RENDERER } from './constants.js';

/**
 * Three.js 씬 설정 클래스
 * 
 * @class SceneSetup
 */
export class SceneSetup {
    constructor() {
        /**
         * Three.js 씬 객체
         * @type {THREE.Scene}
         * @tutorial https://threejs.org/docs/#api/en/scenes/Scene
         */
        this.scene = null;
        
        /**
         * Three.js 카메라 객체
         * @type {THREE.PerspectiveCamera}
         * @tutorial https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
         */
        this.camera = null;
        
        /**
         * Three.js 렌더러 객체
         * @type {THREE.WebGLRenderer}
         * @tutorial https://threejs.org/docs/#api/en/renderers/WebGLRenderer
         */
        this.renderer = null;
        
        /**
         * 조명 객체들
         * @type {Object}
         */
        this.lights = {
            ambient: null,
            directional: null,
        };
        
        /**
         * 레이어 정의 (렌더링 최적화용)
         * @type {Object}
         */
        this.layers = {
            tiles: 0,
            borders: 1,
            characters: 2,
            ui: 3,
        };
    }
    
    /**
     * 씬 초기화
     * @returns {THREE.Scene} 생성된 씬 객체
     */
    initScene() {
        // 씬 생성
        this.scene = new THREE.Scene();
        
        // 배경 색상 설정
        this.scene.background = new THREE.Color(0x2c3e50);
        
        // 안개 효과 추가 (깊이감 표현)
        // 안개는 카메라로부터의 거리에 따라 객체를 페이드 아웃시킵니다
        this.scene.fog = new THREE.Fog(COLORS.FOG_COLOR, 10, 50);
        
        console.log('씬 초기화 완료');
        return this.scene;
    }
    
    /**
     * 카메라 초기화
     * @param {number} aspectRatio - 화면 비율 (width/height)
     * @returns {THREE.PerspectiveCamera} 생성된 카메라 객체
     */
    initCamera(aspectRatio = window.innerWidth / window.innerHeight) {
        // 원근 카메라 생성
        // 매개변수: FOV(시야각), 종횡비, near(최소 렌더 거리), far(최대 렌더 거리)
        this.camera = new THREE.PerspectiveCamera(
            75,          // 시야각 (degrees)
            aspectRatio, // 종횡비
            0.1,         // near plane
            1000         // far plane
        );
        
        // 카메라 초기 위치 설정
        this.camera.position.set(
            CAMERA.INITIAL_POSITION.x,
            CAMERA.INITIAL_POSITION.y,
            CAMERA.INITIAL_POSITION.z
        );
        
        // 카메라가 바라볼 지점 설정
        this.camera.lookAt(
            CAMERA.INITIAL_TARGET.x,
            CAMERA.INITIAL_TARGET.y,
            CAMERA.INITIAL_TARGET.z
        );
        
        console.log('카메라 초기화 완료');
        return this.camera;
    }
    
    /**
     * 렌더러 초기화
     * @param {HTMLElement} container - 렌더러를 추가할 DOM 요소
     * @returns {THREE.WebGLRenderer} 생성된 렌더러 객체
     */
    initRenderer(container = document.body) {
        console.log('initRenderer called with container:', container);
        
        // WebGL 렌더러 생성
        this.renderer = new THREE.WebGLRenderer({
            antialias: RENDERER.ANTIALIAS, // 계단 현상 방지
            alpha: false                   // 투명 배경 비활성화
        });
        
        // Set clear color explicitly
        this.renderer.setClearColor(0x2c3e50, 1);
        
        console.log('WebGLRenderer created:', this.renderer);
        
        // 렌더러 크기 설정
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        
        // 픽셀 밀도 설정 (레티나 디스플레이 대응)
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // 그림자 설정
        this.renderer.shadowMap.enabled = RENDERER.SHADOW_MAP_ENABLED;
        this.renderer.shadowMap.type = THREE[RENDERER.SHADOW_MAP_TYPE];
        
        // DOM에 캔버스 추가
        console.log('About to append canvas to container');
        console.log('Container element:', container);
        console.log('Renderer domElement:', this.renderer.domElement);
        
        try {
            container.appendChild(this.renderer.domElement);
            console.log('Canvas successfully appended');
        } catch (error) {
            console.error('Failed to append canvas:', error);
        }
        
        console.log('렌더러 초기화 완료');
        console.log('Canvas added to:', container);
        console.log('Canvas element:', this.renderer.domElement);
        console.log('Canvas size:', this.renderer.domElement.width, 'x', this.renderer.domElement.height);
        console.log('Container children after append:', container.children.length);
        return this.renderer;
    }
    
    /**
     * 조명 초기화
     * @tutorial https://threejs.org/docs/#api/en/lights/Light
     */
    initLights() {
        // 환경광 (Ambient Light)
        // 모든 객체를 균일하게 비추는 광원
        this.lights.ambient = new THREE.AmbientLight(
            COLORS.AMBIENT_LIGHT, // 색상
            1                     // 강도
        );
        this.scene.add(this.lights.ambient);
        
        // 방향광 (Directional Light)
        // 태양광처럼 평행한 빛을 만드는 광원
        this.lights.directional = new THREE.DirectionalLight(
            COLORS.DIRECTIONAL_LIGHT, // 색상
            1                         // 강도
        );
        
        // 방향광 위치 설정
        this.lights.directional.position.set(10, 10, 5);
        
        // 그림자 설정
        this.lights.directional.castShadow = true;
        this.lights.directional.shadow.camera.left = -20;
        this.lights.directional.shadow.camera.right = 20;
        this.lights.directional.shadow.camera.top = 20;
        this.lights.directional.shadow.camera.bottom = -20;
        this.lights.directional.shadow.camera.near = 0.1;
        this.lights.directional.shadow.camera.far = 50;
        
        // 그림자 해상도
        this.lights.directional.shadow.mapSize.width = 2048;
        this.lights.directional.shadow.mapSize.height = 2048;
        
        this.scene.add(this.lights.directional);
        
        console.log('조명 초기화 완료');
    }
    
    /**
     * 창 크기 변경 대응
     */
    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // 카메라 종횡비 업데이트
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // 렌더러 크기 업데이트
        this.renderer.setSize(width, height);
    }
    
    /**
     * 렌더링 실행
     */
    render() {
        // Debug: Check if we're actually rendering
        if (!this._renderCount) {
            this._renderCount = 0;
        }
        if (this._renderCount < 5) {
            console.log(`Render call ${this._renderCount}: scene has ${this.scene.children.length} children`);
            this._renderCount++;
            
            // Debug: Log first few mesh positions
            let meshCount = 0;
            this.scene.traverse((obj) => {
                if (obj.isMesh && meshCount < 3) {
                    console.log(`Mesh ${meshCount}: pos (${obj.position.x.toFixed(1)}, ${obj.position.y.toFixed(1)}, ${obj.position.z.toFixed(1)})`);
                    meshCount++;
                }
            });
        }
        
        
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * 전체 초기화
     * @param {HTMLElement} container - 렌더러를 추가할 DOM 요소
     * @returns {Object} 씬, 카메라, 렌더러 객체
     */
    init(container = document.body) {
        this.initScene();
        this.initCamera();
        this.initRenderer(container);
        this.initLights();
        
        // 창 크기 변경 이벤트 리스너 추가
        window.addEventListener('resize', () => this.handleResize());
        
        return {
            scene: this.scene,
            camera: this.camera,
            renderer: this.renderer,
            lights: this.lights,
        };
    }
    
    /**
     * 리소스 정리
     */
    dispose() {
        // 렌더러 정리
        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.domElement.remove();
        }
        
        // 씬 정리
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) {
                    object.geometry.dispose();
                }
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
            
            this.scene.clear();
        }
        
        // 이벤트 리스너 제거
        window.removeEventListener('resize', this.handleResize);
        
        console.log('리소스 정리 완료');
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
export const sceneSetup = new SceneSetup();