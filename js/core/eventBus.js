/**
 * 글로벌 이벤트 버스
 * 
 * mitt를 사용한 중앙 이벤트 시스템입니다.
 * 게임 내 모든 컴포넌트 간의 통신을 담당합니다.
 * 
 * @module eventBus
 */

import mitt from 'mitt';

/**
 * 이벤트 타입 정의
 * @enum {string}
 */
export const GameEvents = {
    // 애니메이션 이벤트
    ANIMATION_COMPLETE: 'animation:complete',
    MOVE_ANIMATION_COMPLETE: 'animation:move:complete',
    ATTACK_ANIMATION_COMPLETE: 'animation:attack:complete',
    DAMAGE_ANIMATION_COMPLETE: 'animation:damage:complete',
    DEATH_ANIMATION_COMPLETE: 'animation:death:complete',
    
    // 턴 관련 이벤트
    TURN_START: 'turn:start',
    TURN_END: 'turn:end',
    CHECK_TURN_END: 'turn:check',
    
    // 캐릭터 액션 이벤트
    CHARACTER_MOVED: 'character:moved',
    CHARACTER_ATTACKED: 'character:attacked',
    CHARACTER_DIED: 'character:died',
    
    // 게임 상태 이벤트
    GAME_STARTED: 'game:started',
    GAME_ENDED: 'game:ended',
    
    // UI 이벤트
    UI_UPDATE: 'ui:update',
    DAMAGE_TEXT: 'ui:damage:text'
};

/**
 * 이벤트 버스 인스턴스
 * @type {import('mitt').Emitter}
 */
export const eventBus = mitt();

// 디버깅을 위한 이벤트 로깅 (개발 환경에서만)
// if (import.meta.env.DEV) {
//     eventBus.on('*', (type, event) => {
//         console.log(`[EventBus] ${type}`, event);
//     });
// }