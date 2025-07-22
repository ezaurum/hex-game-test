/**
 * 애니메이션 유틸리티
 * 
 * 게임에서 사용되는 다양한 애니메이션 효과를 제공하는 유틸리티 모듈입니다.
 * 이징 함수, 트윈, 파티클 효과 등을 포함합니다.
 * 
 * @module animation
 */

/**
 * 이징 함수 모음
 * 
 * t: 현재 시간 (0-1)
 * b: 시작값
 * c: 변화량
 * d: 지속 시간
 * 
 * @namespace Easing
 * @tutorial https://easings.net/
 */
export const Easing = {
    /**
     * 선형 (일정한 속도)
     */
    linear: (t) => t,
    
    /**
     * Quad 이징 (2차 함수)
     */
    quadIn: (t) => t * t,
    quadOut: (t) => t * (2 - t),
    quadInOut: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    
    /**
     * Cubic 이징 (3차 함수)
     */
    cubicIn: (t) => t * t * t,
    cubicOut: (t) => (--t) * t * t + 1,
    cubicInOut: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    
    /**
     * Quart 이징 (4차 함수)
     */
    quartIn: (t) => t * t * t * t,
    quartOut: (t) => 1 - (--t) * t * t * t,
    quartInOut: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    
    /**
     * Sine 이징 (사인 함수)
     */
    sineIn: (t) => 1 - Math.cos((t * Math.PI) / 2),
    sineOut: (t) => Math.sin((t * Math.PI) / 2),
    sineInOut: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    
    /**
     * Expo 이징 (지수 함수)
     */
    expoIn: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
    expoOut: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
    expoInOut: (t) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
        return (2 - Math.pow(2, -20 * t + 10)) / 2;
    },
    
    /**
     * Elastic 이징 (탄성 효과)
     */
    elasticIn: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    },
    elasticOut: (t) => {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    
    /**
     * Bounce 이징 (바운스 효과)
     */
    bounceOut: (t) => {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
    bounceIn: (t) => 1 - Easing.bounceOut(1 - t),
};

/**
 * 트윈 애니메이션 클래스
 * 
 * 객체의 속성을 시간에 따라 부드럽게 변경합니다.
 * @class Tween
 */
export class Tween {
    /**
     * @param {Object} target - 애니메이션 대상 객체
     * @param {Object} properties - 변경할 속성들
     * @param {number} duration - 지속 시간 (밀리초)
     * @param {Function} [easing=Easing.linear] - 이징 함수
     */
    constructor(target, properties, duration, easing = Easing.linear) {
        this.target = target;
        this.properties = properties;
        this.duration = duration;
        this.easing = easing;
        
        this.startTime = null;
        this.startValues = {};
        this.isRunning = false;
        this.onUpdate = null;
        this.onComplete = null;
        
        // 시작값 저장
        for (const key in properties) {
            this.startValues[key] = target[key];
        }
    }
    
    /**
     * 애니메이션 시작
     * @returns {Tween} 체이닝을 위한 this 반환
     */
    start() {
        this.startTime = performance.now();
        this.isRunning = true;
        this.animate();
        return this;
    }
    
    /**
     * 애니메이션 중지
     * @returns {Tween}
     */
    stop() {
        this.isRunning = false;
        return this;
    }
    
    /**
     * 애니메이션 프레임 업데이트
     */
    animate() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        const elapsed = currentTime - this.startTime;
        const progress = Math.min(elapsed / this.duration, 1);
        
        // 이징 적용
        const easedProgress = this.easing(progress);
        
        // 속성 업데이트
        for (const key in this.properties) {
            const start = this.startValues[key];
            const end = this.properties[key];
            this.target[key] = start + (end - start) * easedProgress;
        }
        
        // 콜백 실행
        if (this.onUpdate) {
            this.onUpdate(this.target, progress);
        }
        
        if (progress < 1) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.isRunning = false;
            if (this.onComplete) {
                this.onComplete(this.target);
            }
        }
    }
    
    /**
     * 업데이트 콜백 설정
     * @param {Function} callback
     * @returns {Tween}
     */
    onUpdateCallback(callback) {
        this.onUpdate = callback;
        return this;
    }
    
    /**
     * 완료 콜백 설정
     * @param {Function} callback
     * @returns {Tween}
     */
    onCompleteCallback(callback) {
        this.onComplete = callback;
        return this;
    }
}

/**
 * 애니메이션 시퀀스 클래스
 * 
 * 여러 애니메이션을 순차적으로 실행합니다.
 * @class AnimationSequence
 */
export class AnimationSequence {
    constructor() {
        this.animations = [];
        this.currentIndex = 0;
        this.isRunning = false;
    }
    
    /**
     * 애니메이션 추가
     * @param {Function} animationFunc - 애니메이션 함수 (콜백을 받아야 함)
     * @returns {AnimationSequence}
     */
    add(animationFunc) {
        this.animations.push(animationFunc);
        return this;
    }
    
    /**
     * 지연 추가
     * @param {number} delay - 지연 시간 (밀리초)
     * @returns {AnimationSequence}
     */
    wait(delay) {
        this.animations.push((callback) => {
            setTimeout(callback, delay);
        });
        return this;
    }
    
    /**
     * 시퀀스 시작
     * @param {Function} [onComplete] - 완료 콜백
     */
    start(onComplete) {
        if (this.isRunning || this.animations.length === 0) return;
        
        this.isRunning = true;
        this.currentIndex = 0;
        this.runNext(onComplete);
    }
    
    /**
     * 다음 애니메이션 실행
     * @param {Function} onComplete
     */
    runNext(onComplete) {
        if (this.currentIndex >= this.animations.length) {
            this.isRunning = false;
            if (onComplete) onComplete();
            return;
        }
        
        const animation = this.animations[this.currentIndex];
        this.currentIndex++;
        
        animation(() => {
            this.runNext(onComplete);
        });
    }
}

/**
 * 스프라이트 애니메이션 클래스
 * 
 * 텍스처 아틀라스를 사용한 스프라이트 애니메이션
 * @class SpriteAnimation
 */
export class SpriteAnimation {
    /**
     * @param {THREE.Texture} texture - 스프라이트 시트 텍스처
     * @param {number} tilesX - 가로 타일 수
     * @param {number} tilesY - 세로 타일 수
     * @param {number} frameCount - 총 프레임 수
     * @param {number} frameDuration - 프레임당 지속 시간 (밀리초)
     */
    constructor(texture, tilesX, tilesY, frameCount, frameDuration) {
        this.texture = texture;
        this.tilesX = tilesX;
        this.tilesY = tilesY;
        this.frameCount = frameCount;
        this.frameDuration = frameDuration;
        
        this.currentFrame = 0;
        this.lastFrameTime = 0;
        this.isPlaying = false;
        this.loop = true;
        
        // 텍스처 설정
        this.texture.repeat.set(1 / tilesX, 1 / tilesY);
        this.updateFrame(0);
    }
    
    /**
     * 애니메이션 시작
     */
    play() {
        this.isPlaying = true;
        this.lastFrameTime = performance.now();
    }
    
    /**
     * 애니메이션 정지
     */
    stop() {
        this.isPlaying = false;
        this.currentFrame = 0;
        this.updateFrame(0);
    }
    
    /**
     * 애니메이션 일시정지
     */
    pause() {
        this.isPlaying = false;
    }
    
    /**
     * 애니메이션 업데이트
     * @param {number} currentTime - 현재 시간
     */
    update(currentTime) {
        if (!this.isPlaying) return;
        
        const elapsed = currentTime - this.lastFrameTime;
        
        if (elapsed >= this.frameDuration) {
            this.currentFrame++;
            
            if (this.currentFrame >= this.frameCount) {
                if (this.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frameCount - 1;
                    this.isPlaying = false;
                }
            }
            
            this.updateFrame(this.currentFrame);
            this.lastFrameTime = currentTime;
        }
    }
    
    /**
     * 프레임 업데이트
     * @param {number} frame - 프레임 번호
     */
    updateFrame(frame) {
        const x = frame % this.tilesX;
        const y = Math.floor(frame / this.tilesX);
        
        this.texture.offset.x = x / this.tilesX;
        this.texture.offset.y = 1 - (y + 1) / this.tilesY;
    }
}

/**
 * 파티클 효과 생성기
 * 
 * @param {THREE.Scene} scene - Three.js 씬
 * @param {Object} options - 파티클 옵션
 * @returns {THREE.Points} 파티클 시스템
 */
export function createParticleEffect(scene, options = {}) {
    const {
        count = 100,
        size = 0.1,
        color = 0xffffff,
        texture = null,
        lifetime = 2000,
        velocity = { x: 0, y: 1, z: 0 },
        spread = 1,
        gravity = -0.5,
    } = options;
    
    // 지오메트리 생성
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    const lifetimes = [];
    
    for (let i = 0; i < count; i++) {
        // 위치 (랜덤 분산)
        positions.push(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * spread
        );
        
        // 속도 (기본 속도 + 랜덤)
        velocities.push(
            velocity.x + (Math.random() - 0.5) * 0.5,
            velocity.y + (Math.random() - 0.5) * 0.5,
            velocity.z + (Math.random() - 0.5) * 0.5
        );
        
        // 수명
        lifetimes.push(lifetime + Math.random() * 1000);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.Float32BufferAttribute(lifetimes, 1));
    
    // 재질 생성
    const material = new THREE.PointsMaterial({
        size: size,
        color: color,
        map: texture,
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    
    // 파티클 시스템 생성
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // 업데이트 함수
    const startTime = performance.now();
    particles.userData.update = () => {
        const elapsed = performance.now() - startTime;
        const positions = geometry.attributes.position.array;
        const velocities = geometry.attributes.velocity.array;
        const lifetimes = geometry.attributes.lifetime.array;
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // 수명 체크
            if (elapsed > lifetimes[i]) {
                // 리스폰
                positions[i3] = (Math.random() - 0.5) * spread;
                positions[i3 + 1] = (Math.random() - 0.5) * spread;
                positions[i3 + 2] = (Math.random() - 0.5) * spread;
                lifetimes[i] = elapsed + lifetime + Math.random() * 1000;
            } else {
                // 위치 업데이트
                positions[i3] += velocities[i3] * 0.016;
                positions[i3 + 1] += velocities[i3 + 1] * 0.016;
                positions[i3 + 2] += velocities[i3 + 2] * 0.016;
                
                // 중력 적용
                velocities[i3 + 1] += gravity * 0.016;
            }
        }
        
        geometry.attributes.position.needsUpdate = true;
    };
    
    return particles;
}

/**
 * 화면 흔들기 효과
 * 
 * @param {THREE.Camera} camera - 카메라
 * @param {number} intensity - 흔들기 강도
 * @param {number} duration - 지속 시간
 */
export function shakeCamera(camera, intensity = 0.5, duration = 500) {
    const originalPosition = camera.position.clone();
    const startTime = performance.now();
    
    const shake = () => {
        const elapsed = performance.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            // 랜덤 오프셋 적용
            const currentIntensity = intensity * (1 - progress);
            camera.position.x = originalPosition.x + (Math.random() - 0.5) * currentIntensity;
            camera.position.y = originalPosition.y + (Math.random() - 0.5) * currentIntensity;
            camera.position.z = originalPosition.z + (Math.random() - 0.5) * currentIntensity;
            
            requestAnimationFrame(shake);
        } else {
            // 원래 위치로 복원
            camera.position.copy(originalPosition);
        }
    };
    
    shake();
}

/**
 * 플래시 효과
 * 
 * @param {HTMLElement} element - 대상 요소
 * @param {string} color - 플래시 색상
 * @param {number} duration - 지속 시간
 */
export function flashEffect(element, color = 'white', duration = 200) {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = color;
    overlay.style.opacity = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '9999';
    
    document.body.appendChild(overlay);
    
    // 페이드 인/아웃
    const tween = new Tween(overlay.style, { opacity: '0.8' }, duration / 2, Easing.quadOut);
    tween.onCompleteCallback(() => {
        const fadeOut = new Tween(overlay.style, { opacity: '0' }, duration / 2, Easing.quadIn);
        fadeOut.onCompleteCallback(() => {
            document.body.removeChild(overlay);
        });
        fadeOut.start();
    });
    tween.start();
}