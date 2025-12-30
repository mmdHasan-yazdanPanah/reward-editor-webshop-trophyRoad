// src/types/models.ts

import { ALL_SKIN_IDS } from './skinModels';

export type ObjectId = string;

export interface RewardFileStructure {
  pointTomanRate: number;
  items: RewardEntryInput[];
}

export enum RewardType {
  Gem = 'Gem',
  Gold = 'Gold',
  Chest = 'Chest',
  HeroCardAndSkin = 'HeroCardAndSkin',
  DailyGem = 'DailyGem',
  HeroAbilityCard = 'HeroAbilityCard',
  NewHero = 'NewHero',
  Skin = 'Skin',
  HeroCard = 'HeroCard',
  BattleGoldBoost = 'BattleGoldBoost',
  NormalChestBoost = 'NormalChestBoost',
  CrownChestBoost = 'CrownChestBoost',
  CrownRushBoost = 'CrownRushBoost',
  QuestPointBoost = 'QuestPointBoost',
  AdPlus = 'AdPlus',
  HeroFragment = 'HeroFragment',
  HeroTicket = 'HeroTicket',
  SkinFragment = 'SkinFragment',
  ChestKey = 'ChestKey',
  ChestsDynamite = 'ChestsDynamite',
  AllCards = 'AllCards',
  SelfBoost = 'SelfBoost',
  BattlePass = 'BattlePass',
  EventLeagueLeaderboardUnlock = 'EventLeagueLeaderboardUnlock',
  EventLeagueExpand = 'EventLeagueExpand',
}

export enum chestType {
  None = -1,
  Tutorial1,
  Tutorial2,
  Free,
  Wooden,
  Silver,
  Crown,
  Giant,
  Magical,
  SuperMagical,
  Rent,
  LeaderBoard,
  Tournament,
  Tournament2,
  ClanWarBronze,
  ClanWarSilver,
  ClanWarGold,
  Fortune,
  PiggyBankV2,
}

export interface RewardEntryInput {
  id: string; // Now required
  requiredPoint?: number;
  reward: any;
  additionalDetail?: any;
}

export const HERO_REWARD_TYPES = new Set([
  'HeroCard',
  'HeroAbilityCard',
  'Skin',
  'NewHero',
]);

export const ALL_SKINS: Set<string> = new Set(ALL_SKIN_IDS);

export const EXCLUSIVE_SKINS: Set<string> = new Set([
  'gypsy_senua',
  'taghi_lukyluke',
  'heshmat_godofwar_v1',
  'changiz_rambov1',
  'shapoor_hawaii_v1',
  'balsamic_bababarghi_v1',
  'babajan_diver_v1',
  'dozd_grunch_v1',
  'esi_hairdresser_v1',
  'esi_hairdresser_v2',
  'nanjoon_catwoman_v1',
  'ammekaty_witch_v1',
  'ammekaty_witch_v2',
  'pirate_halloween_v1',
  'pirate_halloween_v2',
  'davood_lizard_v1',
  'mahpeykar_darkqueen_v1',
]);
