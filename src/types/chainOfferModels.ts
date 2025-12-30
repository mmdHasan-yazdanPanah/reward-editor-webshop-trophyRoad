import { RewardType, chestType } from './models';

export interface Condition {
  FeatureName: FeatureName;
  Value: string | number | string[] | number[];
  Relation: Relation;
}

export enum FeatureName {
  TotalPaid = 'TotalPaid',
  LifeTime = 'LifeTime',
  Experience = 'Experience',
  BattlesCount = 'BattlesCount',
  Region = 'Region',
  Arena = 'Arena',
  Heroes = 'Heroes',
  Skins = 'Skins',
}

export enum Relation {
  gt = 'gt',
  gte = 'gte',
  lt = 'lt',
  lte = 'lte',
  eq = 'eq',
  inc = 'inc',
  neq = 'neq',
  exc = 'exc',
}

export type ChainsListConfig = {
  chainsAndConditions: Array<{
    Conditions: Array<Condition>;
    chainList: Array<ChainBase>;
    maxSelect?: number;
    weight?: number;
  }>;
  maxSelect?: number;
};

export type ChainBase = {
  chainId: string;
  duration: number;
  chainOffers: ChainOfferItem[];
  options: Record<string, any>;
  weight?: number;
};

export type ChainOfferRewardItem = {
  rewardType: RewardType;
  amount?: number;
  heroId?: number;
  ability?: 'ab1' | 'ab2' | 'ab3';
  cardAmount?: number;
  skinId?: string;
  chestType?: chestType;
  chestVisual?: chestType;
  pickCardCount?: number;
};

export type ChainOfferItem = {
  cost_IR?: CostConfig;
  cost_EU?: CostConfig;
  cost?: CostConfig;
  rewards: ChainOfferRewardItem[];
  additionalDetails?: {
    isGrandReward?: boolean;
  };
};

export enum CostTypes {
  Money = 'Money',
  Gem = 'Gem',
  Gold = 'Gold',
  Ad = 'Ad',
  Free = 'Free',
  ElPoint = 'ElPoint',
}

export type CostConfigSKU = {
  costType: CostTypes.Money;
  productSku: number;
};

export type CostConfig =
  | {
      costType: CostTypes.Gem | CostTypes.Gold | CostTypes.ElPoint;
      amount: number;
    }
  | {
      costType: CostTypes.Ad | CostTypes.Free;
    }
  | CostConfigSKU;
