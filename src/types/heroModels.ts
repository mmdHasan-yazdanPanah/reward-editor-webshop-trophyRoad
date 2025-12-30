import { SKINS } from './skinModels';

const HERO_NAME_OVERRIDES: Record<string, string> = {
  swat: 'SWAT',
};

const toTitleCase = (value: string) =>
  value ? value[0].toUpperCase() + value.slice(1) : value;

const heroKeyById = new Map<number, string>();
SKINS.forEach((skin) => {
  if (!heroKeyById.has(skin.heroId)) {
    heroKeyById.set(skin.heroId, skin.skinId.split('_')[0]);
  }
});

export const HEROES = Array.from(heroKeyById.entries())
  .sort(([a], [b]) => a - b)
  .map(([heroId, heroKey]) => ({
    heroId,
    heroKey,
    name: HERO_NAME_OVERRIDES[heroKey] ?? toTitleCase(heroKey),
  }));

export const HERO_NAME_BY_ID = HEROES.reduce<Record<number, string>>(
  (acc, hero) => {
    acc[hero.heroId] = hero.name;
    return acc;
  },
  {}
);

export const getHeroName = (heroId?: number): string => {
  if (heroId === -1) return 'Random';
  if (heroId === undefined || heroId === null || Number.isNaN(heroId)) {
    return 'Unknown';
  }
  return HERO_NAME_BY_ID[heroId] ?? `Hero ${heroId}`;
};

export const getHeroLabel = (heroId?: number, baseLabel = 'Hero'): string => {
  const name = getHeroName(heroId);
  if (name === 'Unknown') return baseLabel;
  return `${baseLabel} (${name})`;
};
