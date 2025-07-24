/**
 * 리소스 매니저
 * 
 * 게임에서 사용하는 모든 리소스(모델, 텍스처, 사운드 등)를 중앙에서 관리합니다.
 * 로딩 진행 상황을 추적하고 콜백을 제공합니다.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * 리소스 타입 열거형
 */
export const ResourceType = {
    MODEL: 'model',
    TEXTURE: 'texture',
    SOUND: 'sound',
    JSON: 'json'
};

/**
 * 리소스 정의
 */
const RESOURCES = {
    models: {
        robot: {
            name: 'robot',
            path: 'RobotExpressive/RobotExpressive.glb',
            type: ResourceType.MODEL
        }
    },
    textures: {
        // 텍스처 파일이 준비되면 여기에 추가
    },
    sounds: {
        // 현재는 프로시저럴 사운드를 사용하므로 비워둠
        // 나중에 실제 사운드 파일 추가 시 여기에 정의
    }
};

class ResourceManager {
    constructor() {
        this.resources = new Map();
        this.loaders = {
            [ResourceType.MODEL]: new GLTFLoader(),
            [ResourceType.TEXTURE]: new THREE.TextureLoader(),
            [ResourceType.SOUND]: new Audio(),
            [ResourceType.JSON]: null
        };
        
        this.loadingProgress = {
            total: 0,
            loaded: 0,
            failed: 0,
            items: new Map()
        };
        
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }
    
    /**
     * 모든 리소스 로드
     * @param {Function} onProgress - 진행 상황 콜백 (loaded, total, item)
     * @param {Function} onComplete - 완료 콜백
     * @param {Function} onError - 에러 콜백
     * @returns {Promise}
     */
    async loadAll(onProgress, onComplete, onError) {
        this.onProgress = onProgress;
        this.onComplete = onComplete;
        this.onError = onError;
        
        // 로드할 리소스 목록 생성
        const loadList = [];
        
        // 모든 리소스를 플랫 리스트로 변환
        Object.values(RESOURCES).forEach(category => {
            Object.values(category).forEach(resource => {
                loadList.push(resource);
            });
        });
        
        this.loadingProgress.total = loadList.length;
        this.loadingProgress.loaded = 0;
        this.loadingProgress.failed = 0;
        
        // 병렬로 모든 리소스 로드
        const promises = loadList.map(resource => this.loadResource(resource));
        
        try {
            await Promise.allSettled(promises);
            
            if (this.loadingProgress.failed > 0) {
                console.warn(`Failed to load ${this.loadingProgress.failed} resources`);
            }
            
            if (this.onComplete) {
                this.onComplete();
            }
        } catch (error) {
            console.error('Error loading resources:', error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * 개별 리소스 로드
     * @param {Object} resource - 리소스 정의
     * @returns {Promise}
     */
    async loadResource(resource) {
        const { name, path, type } = resource;
        
        try {
            this.loadingProgress.items.set(name, { status: 'loading', progress: 0 });
            
            let loadedResource;
            
            switch (type) {
                case ResourceType.MODEL:
                    loadedResource = await this.loadModel(path, name);
                    break;
                    
                case ResourceType.TEXTURE:
                    loadedResource = await this.loadTexture(path, name);
                    break;
                    
                case ResourceType.SOUND:
                    loadedResource = await this.loadSound(path, name);
                    break;
                    
                case ResourceType.JSON:
                    loadedResource = await this.loadJSON(path, name);
                    break;
                    
                default:
                    throw new Error(`Unknown resource type: ${type}`);
            }
            
            this.resources.set(name, loadedResource);
            this.loadingProgress.loaded++;
            this.loadingProgress.items.set(name, { status: 'loaded', progress: 100 });
            
            this.reportProgress(name);
            
            return loadedResource;
            
        } catch (error) {
            console.error(`Failed to load resource: ${name}`, error);
            this.loadingProgress.failed++;
            this.loadingProgress.items.set(name, { status: 'failed', progress: 0, error });
            
            this.reportProgress(name, error);
            
            throw error;
        }
    }
    
    /**
     * 모델 로드
     */
    async loadModel(path, name) {
        return new Promise((resolve, reject) => {
            this.loaders[ResourceType.MODEL].load(
                path,
                (gltf) => {
                    console.log(`Model loaded: ${name}`);
                    resolve(gltf);
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total) * 100;
                    this.loadingProgress.items.set(name, { status: 'loading', progress: percent });
                    this.reportProgress(name);
                },
                (error) => {
                    reject(error);
                }
            );
        });
    }
    
    /**
     * 텍스처 로드
     */
    async loadTexture(path, name) {
        return new Promise((resolve, reject) => {
            this.loaders[ResourceType.TEXTURE].load(
                path,
                (texture) => {
                    console.log(`Texture loaded: ${name}`);
                    resolve(texture);
                },
                undefined,
                (error) => {
                    reject(error);
                }
            );
        });
    }
    
    /**
     * 사운드 로드
     */
    async loadSound(path, name) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                console.log(`Sound loaded: ${name}`);
                resolve(audio);
            });
            
            audio.addEventListener('error', (error) => {
                reject(error);
            });
            
            audio.src = path;
            audio.load();
        });
    }
    
    /**
     * JSON 로드
     */
    async loadJSON(path, name) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log(`JSON loaded: ${name}`);
            return data;
        } catch (error) {
            throw error;
        }
    }
    
    /**
     * 진행 상황 보고
     */
    reportProgress(itemName, error = null) {
        if (this.onProgress) {
            const progress = {
                loaded: this.loadingProgress.loaded,
                failed: this.loadingProgress.failed,
                total: this.loadingProgress.total,
                percent: (this.loadingProgress.loaded / this.loadingProgress.total) * 100,
                currentItem: itemName,
                items: this.loadingProgress.items,
                error
            };
            
            this.onProgress(progress);
        }
    }
    
    /**
     * 리소스 가져오기
     * @param {string} name - 리소스 이름
     * @returns {*} 로드된 리소스
     */
    get(name) {
        if (!this.resources.has(name)) {
            console.warn(`Resource not found: ${name}`);
            return null;
        }
        return this.resources.get(name);
    }
    
    /**
     * 모델 가져오기
     * @param {string} name - 모델 이름
     * @returns {Object} GLTF 객체
     */
    getModel(name) {
        return this.get(name);
    }
    
    /**
     * 텍스처 가져오기
     * @param {string} name - 텍스처 이름
     * @returns {THREE.Texture} 텍스처
     */
    getTexture(name) {
        return this.get(name);
    }
    
    /**
     * 사운드 가져오기
     * @param {string} name - 사운드 이름
     * @returns {Audio} 오디오 객체
     */
    getSound(name) {
        return this.get(name);
    }
    
    /**
     * 리소스 해제
     */
    dispose() {
        this.resources.forEach((resource, name) => {
            if (resource && resource.dispose) {
                resource.dispose();
            }
        });
        this.resources.clear();
        this.loadingProgress.items.clear();
    }
}

// 싱글톤 인스턴스
export const resourceManager = new ResourceManager();