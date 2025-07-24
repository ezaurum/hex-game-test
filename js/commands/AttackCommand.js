/**
 * 공격 커맨드
 * 
 * 캐릭터의 공격 액션을 캡슐화합니다.
 * 
 * @module AttackCommand
 */

import { Command, CommandType } from './Command.js';
import { battleManager } from '../managers/battleManager.js';

/**
 * 공격 커맨드 클래스
 * 
 * @class AttackCommand
 * @extends Command
 */
export class AttackCommand extends Command {
    /**
     * @param {Object} data - 공격 데이터
     * @param {Character} data.attacker - 공격자
     * @param {Character} data.target - 대상
     * @param {number} data.damage - 데미지 (실행 시 계산됨)
     */
    constructor(data) {
        super(CommandType.ATTACK, data);
        
        // 상태 저장
        this.previousState = {
            attackerId: data.attacker.id,
            targetId: data.target.id,
            attackerHasAttacked: data.attacker.hasAttacked,
            attackerActionsUsed: { ...data.attacker.actionsUsed },
            targetHealth: data.target.health,
            targetIsAlive: data.target.isAlive()
        };
    }
    
    /**
     * 공격 실행
     * 
     * @returns {Promise<boolean>} 실행 성공 여부
     */
    async execute() {
        const { attacker, target } = this.data;
        
        // battleManager의 executeAttack를 통해 실제 공격 처리
        const damage = battleManager.executeAttack(attacker, target);
        
        if (damage > 0) {
            this.data.damage = damage;
            this.executed = true;
            return true;
        }
        
        return false;
    }
    
    /**
     * 공격 취소
     * 
     * @returns {Promise<boolean>} 취소 성공 여부
     */
    async undo() {
        if (!this.executed) return false;
        
        const { attacker, target } = this.data;
        
        // 공격자 상태 복원
        attacker.hasAttacked = this.previousState.attackerHasAttacked;
        attacker.actionsUsed = { ...this.previousState.attackerActionsUsed };
        
        // 대상 체력 복원
        target.health = this.previousState.targetHealth;
        
        // 대상이 죽었었다면 부활
        if (!this.previousState.targetIsAlive && target.isDead) {
            target.isDead = false;
            if (target.currentTile) {
                target.currentTile.setOccupant(target);
            }
            // 시각적 복원
            target.group.visible = true;
            target.group.opacity = 1;
            target.group.traverse(child => {
                if (child.material) {
                    child.material.opacity = 1;
                    child.material.transparent = false;
                }
            });
        }
        
        this.executed = false;
        return true;
    }
    
    /**
     * 직렬화
     * 
     * @returns {Object} 직렬화된 데이터
     */
    serialize() {
        const base = super.serialize();
        return {
            ...base,
            attackerId: this.data.attacker.id,
            targetId: this.data.target.id,
            damage: this.data.damage
        };
    }
}