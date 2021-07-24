import {
  BASE_THRESHOLD_ID,
  DEFAULT_BASE_THRESHOLD,
  Threshold,
} from './thresholds';

export interface CardConfiguration {
  name: string;
  thresholds: Threshold[];
  taxRate: number;
}

const TIER_2_ID = 'Tier 2';
export const CUSTOM_CARD_NAME = 'Custom';

export const CUSTOM_CARD_DEFAULT = {
  name: CUSTOM_CARD_NAME,
  taxRate: 0,
  thresholds: [DEFAULT_BASE_THRESHOLD],
};

export const ARTA: CardConfiguration = {
  name: 'ARTA Card',
  taxRate: 0,
  thresholds: [
    {
      id: BASE_THRESHOLD_ID,
      activeFrom: 0,
      multiplier: 1.5,
    },
    {
      id: TIER_2_ID,
      activeFrom: 200000,
      multiplier: 0.5,
    },
  ],
};

export const ANZ_BUSINESS_BLACK: CardConfiguration = {
  name: 'ANZ Business Black',
  taxRate: 0.5,
  thresholds: [
    {
      id: BASE_THRESHOLD_ID,
      activeFrom: 0,
      multiplier: 1.5,
    },
    {
      id: TIER_2_ID,
      activeFrom: 1000000,
      multiplier: 1,
    },
  ],
};

export const ANZ_REWARDS_BLACK: CardConfiguration = {
  name: 'ANZ Rewards Black',
  taxRate: 0,
  thresholds: [
    {
      id: BASE_THRESHOLD_ID,
      activeFrom: 0,
      multiplier: 2,
    },
    {
      id: TIER_2_ID,
      activeFrom: 500000,
      multiplier: 1,
    },
  ],
};

export const ANZ_BUSINESS_REWARDS: CardConfiguration = {
  name: 'ANZ Business Rewards',
  taxRate: 0.5,
  thresholds: [
    {
      id: BASE_THRESHOLD_ID,
      activeFrom: 0,
      multiplier: 1,
    },
  ],
};

export const ANZ_REWARDS_PLATINUM: CardConfiguration = {
  name: 'ANZ Rewards Platinum',
  taxRate: 0,
  thresholds: [
    {
      id: BASE_THRESHOLD_ID,
      activeFrom: 0,
      multiplier: 1.5,
    },
    {
      id: TIER_2_ID,
      activeFrom: 200000,
      multiplier: 0.5,
    },
  ],
};

export const ANZ_REWARDS: CardConfiguration = {
  name: 'ANZ Rewards',
  taxRate: 0,
  thresholds: [
    {
      id: BASE_THRESHOLD_ID,
      activeFrom: 0,
      multiplier: 1,
    },
    {
      id: TIER_2_ID,
      activeFrom: 100000,
      multiplier: 0.5,
    },
  ],
};

export const CARD_PRESETS = [
  ARTA,
  ANZ_BUSINESS_BLACK,
  ANZ_BUSINESS_REWARDS,
  ANZ_REWARDS,
  ANZ_REWARDS_BLACK,
  ANZ_REWARDS_PLATINUM,
  CUSTOM_CARD_DEFAULT,
];
