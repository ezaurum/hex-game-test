/**
 * 육각형 수학 유틸리티
 * 
 * 육각형 그리드 관련 수학적 계산을 제공하는 유틸리티 모듈입니다.
 * 좌표 변환, 거리 계산, 회전 등의 기능을 포함합니다.
 * 
 * @module hexMath
 * @tutorial https://www.redblobgames.com/grids/hexagons/
 */

import { HEX_SIZE } from '../core/constants.js';

/**
 * 육각형 방향 벡터 (6방향)
 * 
 * 시계 방향으로 0부터 5까지의 방향을 정의
 * @type {Object[]}
 */
export const HEX_DIRECTIONS = [
    { q: 1, r: 0, s: -1 },    // 0: 오른쪽
    { q: 1, r: -1, s: 0 },    // 1: 오른쪽 위
    { q: 0, r: -1, s: 1 },    // 2: 왼쪽 위
    { q: -1, r: 0, s: 1 },    // 3: 왼쪽
    { q: -1, r: 1, s: 0 },    // 4: 왼쪽 아래
    { q: 0, r: 1, s: -1 },    // 5: 오른쪽 아래
];

/**
 * 큐브 좌표를 오프셋 좌표로 변환
 * 
 * Odd-r 오프셋 레이아웃 사용
 * @param {number} q - 큐브 좌표 q
 * @param {number} r - 큐브 좌표 r
 * @returns {{col: number, row: number}} 오프셋 좌표
 * @tutorial https://www.redblobgames.com/grids/hexagons/#conversions-offset
 */
export function cubeToOffset(q, r) {
    const col = q + (r - (r & 1)) / 2;
    const row = r;
    return { col, row };
}

/**
 * 오프셋 좌표를 큐브 좌표로 변환
 * 
 * Odd-r 오프셋 레이아웃 사용
 * @param {number} col - 열 인덱스
 * @param {number} row - 행 인덱스
 * @returns {{q: number, r: number, s: number}} 큐브 좌표
 */
export function offsetToCube(col, row) {
    const q = col - (row - (row & 1)) / 2;
    const r = row;
    const s = -q - r;
    return { q, r, s };
}

/**
 * 큐브 좌표를 픽셀 좌표로 변환
 * 
 * Flat-top 육각형 레이아웃 사용
 * @param {number} q - 큐브 좌표 q
 * @param {number} r - 큐브 좌표 r
 * @param {number} [size=HEX_SIZE] - 육각형 크기
 * @returns {{x: number, y: number}} 픽셀 좌표
 */
export function cubeToPixel(q, r, size = HEX_SIZE) {
    const x = size * (3/2 * q);
    const y = size * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
    return { x, y };
}

/**
 * 픽셀 좌표를 큐브 좌표로 변환
 * 
 * 마우스 위치 등을 육각형 좌표로 변환할 때 사용
 * @param {number} x - X 픽셀 좌표
 * @param {number} y - Y 픽셀 좌표
 * @param {number} [size=HEX_SIZE] - 육각형 크기
 * @returns {{q: number, r: number, s: number}} 큐브 좌표
 */
export function pixelToCube(x, y, size = HEX_SIZE) {
    const q = (2/3 * x) / size;
    const r = (-1/3 * x + Math.sqrt(3)/3 * y) / size;
    return cubeRound(q, r);
}

/**
 * 큐브 좌표 반올림
 * 
 * 부동소수점 큐브 좌표를 정수로 반올림
 * q + r + s = 0 제약을 만족하도록 처리
 * @param {number} q - 큐브 좌표 q (부동소수점)
 * @param {number} r - 큐브 좌표 r (부동소수점)
 * @returns {{q: number, r: number, s: number}} 반올림된 큐브 좌표
 */
export function cubeRound(q, r) {
    const s = -q - r;
    
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);
    
    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);
    
    if (qDiff > rDiff && qDiff > sDiff) {
        rq = -rr - rs;
    } else if (rDiff > sDiff) {
        rr = -rq - rs;
    } else {
        rs = -rq - rr;
    }
    
    return { q: rq, r: rr, s: rs };
}

/**
 * 두 육각형 사이의 거리 계산
 * 
 * 맨해튼 거리 사용
 * @param {Object} hexA - 첫 번째 육각형 {q, r, s}
 * @param {Object} hexB - 두 번째 육각형 {q, r, s}
 * @returns {number} 거리 (육각형 개수)
 */
export function hexDistance(hexA, hexB) {
    return (Math.abs(hexA.q - hexB.q) + 
            Math.abs(hexA.r - hexB.r) + 
            Math.abs(hexA.s - hexB.s)) / 2;
}

/**
 * 육각형 이웃 좌표 가져오기
 * 
 * @param {Object} hex - 중심 육각형 {q, r, s}
 * @param {number} direction - 방향 (0-5)
 * @returns {{q: number, r: number, s: number}} 이웃 좌표
 */
export function hexNeighbor(hex, direction) {
    const dir = HEX_DIRECTIONS[direction % 6];
    return {
        q: hex.q + dir.q,
        r: hex.r + dir.r,
        s: hex.s + dir.s
    };
}

/**
 * 모든 이웃 좌표 가져오기
 * 
 * @param {Object} hex - 중심 육각형 {q, r, s}
 * @returns {Object[]} 6개의 이웃 좌표 배열
 */
export function hexNeighbors(hex) {
    return HEX_DIRECTIONS.map((dir, i) => hexNeighbor(hex, i));
}

/**
 * 육각형 링(고리) 좌표들 가져오기
 * 
 * 중심에서 특정 거리만큼 떨어진 육각형들
 * @param {Object} center - 중심 육각형 {q, r, s}
 * @param {number} radius - 반지름
 * @returns {Object[]} 링을 구성하는 육각형 좌표 배열
 */
export function hexRing(center, radius) {
    if (radius === 0) return [center];
    
    const results = [];
    
    // 시작 위치: 중심에서 4번 방향(왼쪽 아래)으로 radius만큼 이동
    let hex = {
        q: center.q - radius,
        r: center.r + radius,
        s: center.s
    };
    
    // 6개 방향으로 각각 radius개씩 이동
    for (let i = 0; i < 6; i++) {
        for (let j = 0; j < radius; j++) {
            results.push({ ...hex });
            hex = hexNeighbor(hex, i);
        }
    }
    
    return results;
}

/**
 * 육각형 나선형 좌표들 가져오기
 * 
 * 중심에서 시작하여 나선형으로 확장
 * @param {Object} center - 중심 육각형 {q, r, s}
 * @param {number} radius - 최대 반지름
 * @returns {Object[]} 나선형 순서의 육각형 좌표 배열
 */
export function hexSpiral(center, radius) {
    const results = [center];
    
    for (let r = 1; r <= radius; r++) {
        results.push(...hexRing(center, r));
    }
    
    return results;
}

/**
 * 육각형 범위 내 모든 좌표 가져오기
 * 
 * @param {Object} center - 중심 육각형 {q, r, s}
 * @param {number} range - 범위
 * @returns {Object[]} 범위 내 모든 육각형 좌표
 */
export function hexRange(center, range) {
    const results = [];
    
    for (let q = -range; q <= range; q++) {
        for (let r = Math.max(-range, -q - range); r <= Math.min(range, -q + range); r++) {
            results.push({
                q: center.q + q,
                r: center.r + r,
                s: center.s - q - r
            });
        }
    }
    
    return results;
}

/**
 * 직선 상의 육각형 좌표들 가져오기
 * 
 * 두 육각형 사이의 직선 경로
 * @param {Object} hexA - 시작 육각형 {q, r, s}
 * @param {Object} hexB - 끝 육각형 {q, r, s}
 * @returns {Object[]} 직선 상의 육각형 좌표 배열
 */
export function hexLineDraw(hexA, hexB) {
    const distance = hexDistance(hexA, hexB);
    const results = [];
    
    for (let i = 0; i <= distance; i++) {
        const t = distance === 0 ? 0 : i / distance;
        
        // 선형 보간
        const q = hexA.q * (1 - t) + hexB.q * t;
        const r = hexA.r * (1 - t) + hexB.r * t;
        
        results.push(cubeRound(q, r));
    }
    
    return results;
}

/**
 * 육각형 회전
 * 
 * 중심점을 기준으로 60도 단위로 회전
 * @param {Object} hex - 회전할 육각형 {q, r, s}
 * @param {Object} center - 회전 중심 {q, r, s}
 * @param {number} rotations - 회전 횟수 (1 = 60도)
 * @returns {{q: number, r: number, s: number}} 회전된 좌표
 */
export function hexRotate(hex, center, rotations) {
    // 중심을 원점으로 이동
    let q = hex.q - center.q;
    let r = hex.r - center.r;
    let s = hex.s - center.s;
    
    // 회전 적용 (60도씩)
    const rot = ((rotations % 6) + 6) % 6; // 0-5 범위로 정규화
    
    for (let i = 0; i < rot; i++) {
        const tmp = -s;
        s = -r;
        r = -q;
        q = tmp;
    }
    
    // 원래 위치로 이동
    return {
        q: q + center.q,
        r: r + center.r,
        s: s + center.s
    };
}

/**
 * 육각형 반사 (대칭)
 * 
 * 특정 축을 기준으로 반사
 * @param {Object} hex - 반사할 육각형 {q, r, s}
 * @param {string} axis - 반사 축 ('q', 'r', 's')
 * @returns {{q: number, r: number, s: number}} 반사된 좌표
 */
export function hexReflect(hex, axis) {
    switch (axis) {
        case 'q':
            return { q: hex.q, r: hex.s, s: hex.r };
        case 'r':
            return { q: hex.s, r: hex.r, s: hex.q };
        case 's':
            return { q: hex.r, r: hex.q, s: hex.s };
        default:
            return hex;
    }
}

/**
 * 육각형 좌표가 직사각형 영역 내에 있는지 확인
 * 
 * @param {Object} hex - 확인할 육각형 {q, r, s}
 * @param {number} minQ - 최소 Q 좌표
 * @param {number} maxQ - 최대 Q 좌표
 * @param {number} minR - 최소 R 좌표
 * @param {number} maxR - 최대 R 좌표
 * @returns {boolean} 영역 내 포함 여부
 */
export function hexInRectangle(hex, minQ, maxQ, minR, maxR) {
    return hex.q >= minQ && hex.q <= maxQ && hex.r >= minR && hex.r <= maxR;
}

/**
 * 두 육각형 집합의 교집합 찾기
 * 
 * @param {Object[]} setA - 첫 번째 육각형 집합
 * @param {Object[]} setB - 두 번째 육각형 집합
 * @returns {Object[]} 교집합
 */
export function hexIntersection(setA, setB) {
    const setBMap = new Map();
    
    // setB를 맵으로 변환 (빠른 검색)
    setB.forEach(hex => {
        setBMap.set(`${hex.q},${hex.r}`, hex);
    });
    
    // 교집합 찾기
    return setA.filter(hex => setBMap.has(`${hex.q},${hex.r}`));
}

/**
 * 육각형 좌표를 문자열로 변환
 * 
 * @param {Object} hex - 육각형 좌표 {q, r, s}
 * @returns {string} "q,r" 형식의 문자열
 */
export function hexToString(hex) {
    return `${hex.q},${hex.r}`;
}

/**
 * 문자열을 육각형 좌표로 변환
 * 
 * @param {string} str - "q,r" 형식의 문자열
 * @returns {{q: number, r: number, s: number}} 육각형 좌표
 */
export function stringToHex(str) {
    const [q, r] = str.split(',').map(Number);
    return { q, r, s: -q - r };
}