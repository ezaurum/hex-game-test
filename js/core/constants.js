/**
 * 게임 상수 정의 파일
 * 
 * 이 파일은 게임 전체에서 사용되는 상수들을 정의합니다.
 * 게임 밸런스나 설정을 조정할 때 이 파일만 수정하면 됩니다.
 * 
 * @module constants
 * @tutorial https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Statements/const
 */

/**
 * 육각형 타일 크기 (단위: Three.js 유닛)
 * 타일의 중심에서 꼭짓점까지의 거리
 * @type {number}
 */
export const HEX_SIZE = 1;

/**
 * 그리드 너비 (타일 개수)
 * @type {number}
 */
export const GRID_WIDTH = 10;

/**
 * 그리드 높이 (타일 개수)
 * @type {number}
 */
export const GRID_HEIGHT = 10;

/**
 * 캐릭터 이동 범위 (타일 수)
 * @type {number}
 */
export const MOVEMENT_RANGE = 3;

/**
 * 캐릭터 공격 범위 (타일 수)
 * 1 = 근접 공격만 가능
 * @type {number}
 */
export const ATTACK_RANGE = 1;

/**
 * 기본 공격력
 * 실제 데미지는 ±5의 랜덤 변동이 있음
 * @type {number}
 */
export const BASE_ATTACK_DAMAGE = 20;

/**
 * 공격력 랜덤 변동 범위
 * @type {number}
 */
export const DAMAGE_VARIANCE = 5;

/**
 * 플레이어 캐릭터 초기 체력
 * @type {number}
 */
export const PLAYER_MAX_HEALTH = 100;

/**
 * 적 캐릭터 초기 체력
 * @type {number}
 */
export const ENEMY_MAX_HEALTH = 100;

/**
 * 색상 정의
 * Three.js에서 사용하는 16진수 색상 코드
 * @tutorial https://threejs.org/docs/#api/en/math/Color
 */
export const COLORS = {
    // 타일 색상
    TILE_DEFAULT: 0x4a4a4a,      // 기본 타일 색상 (어두운 회색)
    TILE_HOVER: 0x666666,        // 마우스 호버 시 색상
    TILE_MOVABLE: 0x4a7c4a,      // 이동 가능한 타일 (녹색 계열)
    TILE_ATTACKABLE: 0x7c4a4a,   // 공격 가능한 타일 (붉은 계열)
    TILE_BORDER: 0x333333,       // 타일 테두리 색상
    
    // 캐릭터 색상
    CHARACTER_PLAYER: 0x0080ff,   // 플레이어 색상 (파란색)
    CHARACTER_ENEMY: 0xff0000,    // 적 색상 (빨간색)
    CHARACTER_SELECTED: 0xffff00, // 선택된 캐릭터 강조 색상
    
    // UI 색상
    HEALTH_BAR_BG: 0x333333,      // 체력바 배경
    HEALTH_BAR_FILL: 0x00ff00,   // 체력바 채움 색상
    
    // 환경 색상
    AMBIENT_LIGHT: 0x404040,      // 환경광 색상
    DIRECTIONAL_LIGHT: 0xffffff,  // 방향광 색상
    FOG_COLOR: 0x000000,          // 안개 색상
};

/**
 * 애니메이션 설정
 */
export const ANIMATION = {
    MOVEMENT_DURATION: 500,       // 이동 애니메이션 시간 (밀리초)
    ATTACK_DURATION: 300,         // 공격 애니메이션 시간 (밀리초)
    CAMERA_SMOOTHNESS: 0.1,       // 카메라 이동 부드러움 (0-1)
};

/**
 * 카메라 설정
 */
export const CAMERA = {
    INITIAL_POSITION: { x: 10, y: 10, z: 10 },  // 초기 카메라 위치
    INITIAL_TARGET: { x: 0, y: 0, z: 0 },       // 초기 카메라 타겟
    MIN_ZOOM: 5,                                 // 최소 줌 거리
    MAX_ZOOM: 50,                                // 최대 줌 거리
    ROTATION_SPEED: 0.01,                        // 카메라 회전 속도
    PAN_SPEED: 0.2,                              // 카메라 이동 속도
    ZOOM_SPEED: 0.5,                             // 줌 속도
};

/**
 * Three.js 렌더링 설정
 * @tutorial https://threejs.org/docs/#api/en/renderers/WebGLRenderer
 */
export const RENDERER = {
    ANTIALIAS: true,              // 안티앨리어싱 사용
    SHADOW_MAP_ENABLED: true,     // 그림자 활성화
    SHADOW_MAP_TYPE: 'PCFSoftShadowMap',  // 부드러운 그림자
};

/**
 * 게임 상태 열거형
 * @readonly
 * @enum {string}
 */
export const GAME_STATE = {
    PLAYING: 'playing',
    PLAYER_WON: 'player_won',
    PLAYER_LOST: 'player_lost',
    PAUSED: 'paused',
};

/**
 * 턴 타입 열거형
 * @readonly
 * @enum {string}
 */
export const TURN_TYPE = {
    PLAYER: 'player',
    ENEMY: 'enemy',
};

/**
 * 캐릭터 타입 열거형
 * @readonly
 * @enum {string}
 */
export const CHARACTER_TYPE = {
    PLAYER: 'player',
    ENEMY: 'enemy',
};