// src/utils/validator.ts
import {
  RewardType,
  chestType,
  HERO_REWARD_TYPES,
  ALL_SKINS,
  EXCLUSIVE_SKINS,
  type RewardEntryInput,
} from '../types/models';

export const validateRewardEntry = (entry: RewardEntryInput): string[] => {
  const errors: string[] = [];

  // 1. Validate ID existence
  if (!entry.id || typeof entry.id !== 'string' || entry.id.trim() === '') {
    errors.push('ID is required and must be a string');
  }

  // 2. Validate the inner reward object
  if (entry.reward) {
    errors.push(...validateRewardItem(entry.reward));
  } else {
    errors.push('Reward object is missing');
  }

  return errors;
};

export const validateRewardItem = (reward: any): string[] => {
  const errors: string[] = [];

  const expect = (actual: any) => ({
    toBe: (expected: any) => {
      if (actual !== expected)
        errors.push(`Expected '${expected}' but got '${actual}'`);
    },
    toContain: (subset: any) => {
      if (Array.isArray(actual)) {
        if (!actual.includes(subset))
          errors.push(`Value '${subset}' is invalid.`);
      }
    },
    toBeGreaterThan: (num: number) => {
      if (actual <= num) errors.push(`Value must be greater than ${num}`);
    },
    toBeGreaterThanOrEqual: (num: number) => {
      if (actual < num) errors.push(`Value must be >= ${num}`);
    },
    not: {
      toBe: (val: any) => {
        if (actual === val) errors.push(`Value must not be ${val}`);
      },
    },
  });

  try {
    if (!reward) return ['Reward object is missing'];

    expect(typeof reward.rewardType).toBe('string');

    if (!Object.values(RewardType).includes(reward.rewardType)) {
      errors.push(`Invalid RewardType: ${reward.rewardType}`);
      return errors;
    }

    if (Object.prototype.hasOwnProperty.call(reward, 'givenArena')) {
      expect(typeof reward.givenArena).toBe('number');
    }

    switch (reward.rewardType) {
      case RewardType.Gem:
      case RewardType.Gold:
        expect(typeof reward.amount).toBe('number');
        expect(reward.amount).toBeGreaterThan(0);
        break;

      case RewardType.Chest:
        expect(typeof reward.amount).toBe('number');
        expect(typeof reward.chestType).toBe('number');
        if (!Object.values(chestType).includes(reward.chestType)) {
          errors.push('Invalid Chest Type');
        }
        expect(reward.chestType).not.toBe(chestType.None);
        break;

      case RewardType.Skin:
        expect(typeof reward.skinId).toBe('string');
        expect(typeof reward.heroId).toBe('number');
        if (!ALL_SKINS.has(reward.skinId))
          errors.push(`Skin '${reward.skinId}' not found in ALL_SKINS`);
        if (EXCLUSIVE_SKINS.has(reward.skinId))
          errors.push(`Skin '${reward.skinId}' is Exclusive`);
        break;

      case RewardType.HeroCard:
        expect(typeof reward.heroId).toBe('number');
        break;

      case RewardType.HeroCardAndSkin:
        expect(typeof reward.heroId).toBe('number');
        const hasSkin = Object.prototype.hasOwnProperty.call(reward, 'skinId');
        const hasCardAmount = Object.prototype.hasOwnProperty.call(
          reward,
          'cardAmount'
        );

        if (hasSkin) {
          expect(typeof reward.skinId).toBe('string');
          if (!ALL_SKINS.has(reward.skinId))
            errors.push(`Skin '${reward.skinId}' invalid`);
          if (EXCLUSIVE_SKINS.has(reward.skinId))
            errors.push(`Skin '${reward.skinId}' is exclusive`);
          if (hasCardAmount)
            errors.push('Cannot have cardAmount if skinId is present');
        } else {
          if (!hasCardAmount) errors.push('Must have cardAmount if no skinId');
          expect(typeof reward.cardAmount).toBe('number');
          expect(reward.cardAmount).toBeGreaterThan(0);
        }
        break;

      case RewardType.NewHero:
        expect(typeof reward.heroId).toBe('number');
        break;

      case RewardType.HeroAbilityCard:
        expect(typeof reward.heroId).toBe('number');
        expect(reward.heroId).toBeGreaterThanOrEqual(-1);
        if (!['ab1', 'ab2', 'ab3'].includes(reward.ability))
          errors.push('Ability must be ab1, ab2, or ab3');
        expect(typeof reward.cardAmount).toBe('number');
        expect(reward.cardAmount).toBeGreaterThan(0);
        break;

      case RewardType.BattleGoldBoost:
      case RewardType.NormalChestBoost:
      case RewardType.CrownChestBoost:
      case RewardType.CrownRushBoost:
      case RewardType.QuestPointBoost:
      case RewardType.SelfBoost:
      case RewardType.AdPlus:
        expect(typeof reward.durationSeconds).toBe('number');
        break;

      case RewardType.DailyGem:
        expect(typeof reward.durationInDay).toBe('number');
        break;
    }

    if (HERO_REWARD_TYPES.has(reward.rewardType)) {
      expect(typeof reward.heroId).toBe('number');
      if (reward.rewardType !== RewardType.HeroAbilityCard) {
        expect(reward.heroId).toBeGreaterThanOrEqual(0);
      }
    }
  } catch (e: any) {
    errors.push(`System Error during validation: ${e.message}`);
  }

  return errors;
};
