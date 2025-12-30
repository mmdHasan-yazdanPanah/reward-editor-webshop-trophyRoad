import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  IconButton,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert,
  Stack,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  FormProvider,
  type FieldArrayPath,
  type FieldPath,
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from 'react-hook-form';

import {
  ALL_SKINS,
  EXCLUSIVE_SKINS,
  RewardType,
  chestType,
} from '../types/models';
import { getHeroLabel, getHeroName, HEROES } from '../types/heroModels';
import { SKINS_BY_HERO } from '../types/skinModels';
import {
  type ChainBase,
  type ChainOfferItem,
  type ChainOfferRewardItem,
  type ChainsListConfig,
  type Condition,
  type CostConfig,
  CostTypes,
  FeatureName,
  Relation,
} from '../types/chainOfferModels';

dayjs.extend(duration);
dayjs.extend(relativeTime);

const numericFeatureNames = new Set([
  FeatureName.TotalPaid,
  FeatureName.LifeTime,
  FeatureName.Experience,
  FeatureName.BattlesCount,
  FeatureName.Arena,
  FeatureName.Heroes,
]);

const createDefaultReward = (): ChainOfferRewardItem => ({
  rewardType: RewardType.Gem,
  amount: 10,
});

const createDefaultOffer = (): ChainOfferItem => ({
  rewards: [createDefaultReward()],
  cost: { costType: CostTypes.Free },
});

const createDefaultChain = (): ChainBase => ({
  chainId: 'chain-',
  duration: 0,
  options: {
    hiddenRewards: false,
  },
  chainOffers: [createDefaultOffer()],
});

const createDefaultGroup =
  (): ChainsListConfig['chainsAndConditions'][number] => ({
    Conditions: [
      {
        FeatureName: FeatureName.Heroes,
        Relation: Relation.inc,
        Value: [1],
      },
    ],
    chainList: [createDefaultChain()],
  });

const defaultValues: ChainsListConfig = {
  chainsAndConditions: [createDefaultGroup()],
};

const formatConditionValue = (value: Condition['Value']): string => {
  if (Array.isArray(value)) return value.join(', ');
  if (value === undefined || value === null) return '';
  return String(value);
};

const parseConditionValue = (
  input: string,
  featureName?: FeatureName,
  options?: { allowPartial?: boolean; relation?: Relation }
) => {
  const trimmed = input.trim();
  const allowPartial = options?.allowPartial ?? true;
  const hasTrailingComma = /,\s*$/.test(input);
  const relation = options?.relation;
  const isArrayRelation =
    relation === Relation.inc || relation === Relation.exc;
  const isNumericRelation =
    relation === Relation.gt ||
    relation === Relation.gte ||
    relation === Relation.lt ||
    relation === Relation.lte;
  const isSingleRelation =
    relation === Relation.eq || relation === Relation.neq || isNumericRelation;

  if (allowPartial && hasTrailingComma && !isSingleRelation) return input;
  if (!trimmed) return isArrayRelation ? [] : '';

  const rawParts = trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const hasArray = rawParts.length > 1;
  const isNumericFeature = featureName
    ? numericFeatureNames.has(featureName)
    : false;

  const toNumberOrString = (value: string) => {
    const asNumber = Number(value);
    if (!Number.isNaN(asNumber) && value !== '') return asNumber;
    return value;
  };

  const shouldArray = isArrayRelation || (!isSingleRelation && hasArray);

  if (shouldArray) {
    if (isNumericFeature) {
      return rawParts
        .map((part) => Number(part))
        .filter((val) => !Number.isNaN(val));
    }
    return rawParts.map(toNumberOrString);
  }

  if (isNumericRelation || isNumericFeature) {
    const asNumber = Number(trimmed);
    return Number.isNaN(asNumber) ? '' : asNumber;
  }

  return toNumberOrString(trimmed);
};

const allSkinIds = Array.from(ALL_SKINS);
const arenaOptions = Array.from({ length: 13 }, (_, index) => index);
const moneySkuOptions = [
  900, 1900, 2400, 2900, 4900, 7400, 9900, 12400, 14900, 19900, 24900, 29900,
  34900, 39900, 44900, 49900, 54900, 59900, 64900, 69900, 74900, 79900, 84900,
  89900, 94900, 99900, 124900, 149900, 199900, 249900, 299900, 399900, 499900,
  699900, 999900, 0,
];

const getHeroOptions = (heroId?: number) => {
  if (
    heroId === undefined ||
    heroId === null ||
    Number.isNaN(heroId) ||
    HEROES.some((hero) => hero.heroId === heroId)
  ) {
    return HEROES;
  }

  return [
    { heroId, heroKey: String(heroId), name: getHeroName(heroId) },
    ...HEROES,
  ];
};

const getSkinOptionsForHero = (
  heroId?: number,
  selectedSkinId?: string
): string[] => {
  const heroSkins = heroId !== undefined ? SKINS_BY_HERO[heroId] : undefined;
  const baseOptions =
    heroSkins && heroSkins.length > 0 ? heroSkins : allSkinIds;
  const filteredOptions = baseOptions.filter(
    (skinId) => !EXCLUSIVE_SKINS.has(skinId)
  );

  if (
    selectedSkinId &&
    !EXCLUSIVE_SKINS.has(selectedSkinId) &&
    !filteredOptions.includes(selectedSkinId)
  ) {
    return [selectedSkinId, ...filteredOptions];
  }

  return filteredOptions;
};

type DurationUnit = 'second' | 'minute' | 'hour' | 'day';

const durationUnits: Array<{ label: string; value: DurationUnit }> = [
  { label: 'Seconds', value: 'second' },
  { label: 'Minutes', value: 'minute' },
  { label: 'Hours', value: 'hour' },
  { label: 'Days', value: 'day' },
];

const durationUnitMs: Record<DurationUnit, number> = {
  second: 1000,
  minute: 60 * 1000,
  hour: 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
};

const getDefaultDurationUnit = (durationMs: number): DurationUnit => {
  if (durationMs >= durationUnitMs.day && durationMs % durationUnitMs.day === 0)
    return 'day';
  if (
    durationMs >= durationUnitMs.hour &&
    durationMs % durationUnitMs.hour === 0
  )
    return 'hour';
  if (
    durationMs >= durationUnitMs.minute &&
    durationMs % durationUnitMs.minute === 0
  )
    return 'minute';
  return 'second';
};

const formatDurationAmount = (
  durationMs: number,
  unit: DurationUnit
): string => {
  const raw = durationMs / durationUnitMs[unit];
  if (!Number.isFinite(raw)) return '0';
  const rounded = Math.round(raw * 100) / 100;
  return String(rounded);
};

const createEmptyCost = (costType: CostTypes): CostConfig => {
  switch (costType) {
    case CostTypes.Money:
      return { costType, productSku: 0 };
    case CostTypes.Gem:
    case CostTypes.Gold:
    case CostTypes.ElPoint:
      return { costType, amount: 0 };
    case CostTypes.Ad:
    case CostTypes.Free:
      return { costType };
  }
};

const CostEditor: React.FC<{ namePrefix: string }> = ({ namePrefix }) => {
  const { control, setValue } = useFormContext<ChainsListConfig>();
  const cost = useWatch({
    control,
    name: namePrefix as FieldPath<ChainsListConfig>,
  }) as CostConfig | undefined;
  const costType = cost?.costType || CostTypes.Free;

  const handleCostTypeChange = (nextType: CostTypes) => {
    setValue(namePrefix as any, createEmptyCost(nextType), {
      shouldDirty: true,
    });
  };

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          select
          fullWidth
          label="Cost Type"
          value={costType}
          onChange={(e) => handleCostTypeChange(e.target.value as CostTypes)}>
          {Object.values(CostTypes).map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {[CostTypes.Gem, CostTypes.Gold, CostTypes.ElPoint].includes(
        costType
      ) && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Amount"
            type="number"
            fullWidth
            value={(cost as any)?.amount ?? 0}
            onChange={(e) =>
              setValue(`${namePrefix}.amount` as any, Number(e.target.value), {
                shouldDirty: true,
              })
            }
          />
        </Grid>
      )}

      {costType === CostTypes.Money && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            select
            label="Product SKU"
            fullWidth
            value={(cost as any)?.productSku ?? 0}
            onChange={(e) =>
              setValue(
                `${namePrefix}.productSku` as any,
                Number(e.target.value),
                { shouldDirty: true }
              )
            }>
            {moneySkuOptions.map((sku) => (
              <MenuItem key={sku} value={sku}>
                {sku.toLocaleString()}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}
    </Grid>
  );
};

const RewardFields: React.FC<{ namePrefix: string }> = ({ namePrefix }) => {
  const { control, setValue } = useFormContext<ChainsListConfig>();
  const reward = useWatch({
    control,
    name: namePrefix as FieldPath<ChainsListConfig>,
  }) as ChainOfferRewardItem | undefined;
  const rewardType = reward?.rewardType;
  const showAmount =
    rewardType !== RewardType.Chest &&
    rewardType !== RewardType.HeroCard &&
    rewardType !== RewardType.HeroAbilityCard &&
    rewardType !== RewardType.NewHero &&
    rewardType !== RewardType.Skin &&
    rewardType !== undefined;

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <TextField
          select
          fullWidth
          label="Reward Type"
          value={rewardType || RewardType.Gem}
          onChange={(e) =>
            setValue(
              `${namePrefix}.rewardType` as any,
              e.target.value as RewardType,
              { shouldDirty: true }
            )
          }>
          {Object.values(RewardType).map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      {showAmount && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Amount"
            type="number"
            fullWidth
            value={reward?.amount ?? 0}
            onChange={(e) =>
              setValue(`${namePrefix}.amount` as any, Number(e.target.value), {
                shouldDirty: true,
              })
            }
          />
        </Grid>
      )}

      {rewardType === RewardType.Chest && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Amount"
              type="number"
              fullWidth
              value={reward?.amount ?? 0}
              onChange={(e) =>
                setValue(
                  `${namePrefix}.amount` as any,
                  Number(e.target.value),
                  { shouldDirty: true }
                )
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              label="Chest Type"
              value={reward?.chestType ?? chestType.Free}
              onChange={(e) =>
                setValue(
                  `${namePrefix}.chestType` as any,
                  Number(e.target.value),
                  { shouldDirty: true }
                )
              }>
              {Object.keys(chestType)
                .filter((key) => Number.isNaN(Number(key)))
                .map((key) => (
                  <MenuItem
                    key={key}
                    value={chestType[key as keyof typeof chestType]}>
                    {key}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>
        </>
      )}

      {rewardType === RewardType.NewHero && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label={getHeroLabel(reward?.heroId)}
            select
            fullWidth
            value={reward?.heroId ?? ''}
            onChange={(e) =>
              setValue(
                `${namePrefix}.heroId` as any,
                e.target.value === '' ? undefined : Number(e.target.value),
                { shouldDirty: true }
              )
            }
          >
            <MenuItem value="">
              <em>Pick hero</em>
            </MenuItem>
            {getHeroOptions(reward?.heroId).map((hero) => (
              <MenuItem key={hero.heroId} value={hero.heroId}>
                {hero.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )}

      {rewardType === RewardType.HeroCard && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={getHeroLabel(reward?.heroId)}
              select
              fullWidth
              value={reward?.heroId ?? ''}
              onChange={(e) =>
                setValue(
                  `${namePrefix}.heroId` as any,
                  e.target.value === '' ? undefined : Number(e.target.value),
                  { shouldDirty: true }
                )
              }
            >
              <MenuItem value="">
                <em>Pick hero</em>
              </MenuItem>
              {getHeroOptions(reward?.heroId).map((hero) => (
                <MenuItem key={hero.heroId} value={hero.heroId}>
                  {hero.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Card Amount"
              type="number"
              fullWidth
              value={reward?.cardAmount ?? 0}
              onChange={(e) =>
                setValue(
                  `${namePrefix}.cardAmount` as any,
                  Number(e.target.value),
                  { shouldDirty: true }
                )
              }
            />
          </Grid>
        </>
      )}

      {rewardType === RewardType.HeroAbilityCard && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={getHeroLabel(reward?.heroId)}
              select
              fullWidth
              value={reward?.heroId ?? ''}
              onChange={(e) =>
                setValue(
                  `${namePrefix}.heroId` as any,
                  e.target.value === '' ? undefined : Number(e.target.value),
                  { shouldDirty: true }
                )
              }
            >
              <MenuItem value="">
                <em>Pick hero</em>
              </MenuItem>
              {getHeroOptions(reward?.heroId).map((hero) => (
                <MenuItem key={hero.heroId} value={hero.heroId}>
                  {hero.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              select
              fullWidth
              label="Ability"
              value={reward?.ability ?? 'ab1'}
              onChange={(e) =>
                setValue(`${namePrefix}.ability` as any, e.target.value, {
                  shouldDirty: true,
                })
              }>
              <MenuItem value="ab1">ab1</MenuItem>
              <MenuItem value="ab2">ab2</MenuItem>
              <MenuItem value="ab3">ab3</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label="Card Amount"
              type="number"
              fullWidth
              value={reward?.cardAmount ?? 0}
              onChange={(e) =>
                setValue(
                  `${namePrefix}.cardAmount` as any,
                  Number(e.target.value),
                  { shouldDirty: true }
                )
              }
            />
          </Grid>
        </>
      )}

      {rewardType === RewardType.Skin && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              label={getHeroLabel(reward?.heroId)}
              select
              fullWidth
              value={reward?.heroId ?? ''}
              onChange={(e) =>
                setValue(
                  `${namePrefix}.heroId` as any,
                  e.target.value === '' ? undefined : Number(e.target.value),
                  { shouldDirty: true }
                )
              }
            >
              <MenuItem value="">
                <em>Pick hero</em>
              </MenuItem>
              {getHeroOptions(reward?.heroId).map((hero) => (
                <MenuItem key={hero.heroId} value={hero.heroId}>
                  {hero.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Skin ID"
              value={reward?.skinId ?? ''}
              onChange={(e) =>
                setValue(`${namePrefix}.skinId` as any, e.target.value, {
                  shouldDirty: true,
                })
              }>
              {getSkinOptionsForHero(reward?.heroId, reward?.skinId).map(
                (skinId) => (
                  <MenuItem key={skinId} value={skinId}>
                    {skinId}
                  </MenuItem>
                )
              )}
            </TextField>
          </Grid>
        </>
      )}

      {!rewardType && (
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Amount"
            type="number"
            fullWidth
            value={reward?.amount ?? 0}
            onChange={(e) =>
              setValue(`${namePrefix}.amount` as any, Number(e.target.value), {
                shouldDirty: true,
              })
            }
          />
        </Grid>
      )}
    </Grid>
  );
};

const RewardsList: React.FC<{ namePrefix: string }> = ({ namePrefix }) => {
  const { control } = useFormContext<ChainsListConfig>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${namePrefix}.rewards` as FieldArrayPath<ChainsListConfig>,
  });

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Rewards ({fields.length})
      </Typography>
      {fields.map((field, rewardIndex) => (
        <Paper key={field.id} sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12 }}>
              <RewardFields
                namePrefix={`${namePrefix}.rewards.${rewardIndex}`}
              />
            </Grid>
            <Grid
              size={{ xs: 12 }}
              sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton color="error" onClick={() => remove(rewardIndex)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Paper>
      ))}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => append(createDefaultReward())}>
        Add Reward
      </Button>
    </Box>
  );
};

const OfferCard: React.FC<{
  namePrefix: string;
  header?: React.ReactNode;
}> = ({ namePrefix, header }) => {
  const { control, setValue } = useFormContext<ChainsListConfig>();
  const offer = useWatch({
    control,
    name: namePrefix as FieldPath<ChainsListConfig>,
  }) as ChainOfferItem | undefined;
  const hasLocalizedCost = Boolean(offer?.cost_IR || offer?.cost_EU);

  const handleToggleCostMode = (useLocalized: boolean) => {
    const nextOffer: ChainOfferItem = {
      rewards: offer?.rewards || [createDefaultReward()],
      additionalDetails: offer?.additionalDetails,
    };

    if (useLocalized) {
      nextOffer.cost_IR = offer?.cost_IR || { costType: CostTypes.Free };
      nextOffer.cost_EU = offer?.cost_EU || { costType: CostTypes.Free };
    } else {
      nextOffer.cost = offer?.cost || { costType: CostTypes.Free };
    }

    setValue(namePrefix as any, nextOffer, { shouldDirty: true });
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {header}
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasLocalizedCost}
                onChange={(e) => handleToggleCostMode(e.target.checked)}
              />
            }
            label="Use localized cost (cost_IR + cost_EU)"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(offer?.additionalDetails?.isGrandReward)}
                onChange={(e) =>
                  setValue(
                    `${namePrefix}.additionalDetails.isGrandReward` as any,
                    e.target.checked,
                    { shouldDirty: true }
                  )
                }
              />
            }
            label="Grand Reward"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          {hasLocalizedCost ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Cost IR
                </Typography>
                <CostEditor namePrefix={`${namePrefix}.cost_IR`} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Cost EU
                </Typography>
                <CostEditor namePrefix={`${namePrefix}.cost_EU`} />
              </Box>
            </Box>
          ) : (
            <CostEditor namePrefix={`${namePrefix}.cost`} />
          )}
        </Grid>
      </Grid>

      <RewardsList namePrefix={namePrefix} />
    </Paper>
  );
};

const SortableOffer: React.FC<{
  id: string;
  index: number;
  namePrefix: string;
  onRemove: () => void;
}> = ({ id, index, namePrefix, onRemove }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ mb: 2 }}>
      <OfferCard
        namePrefix={namePrefix}
        header={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}>
            <Typography variant="subtitle1">Step {index + 1}</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton aria-label="Drag step" {...attributes} {...listeners}>
                <DragIndicatorIcon />
              </IconButton>
              <IconButton color="error" onClick={onRemove}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        }
      />
    </Box>
  );
};

const ChainOffersList: React.FC<{ namePrefix: string }> = ({ namePrefix }) => {
  const { control } = useFormContext<ChainsListConfig>();
  const { fields, append, remove, move, insert } = useFieldArray({
    control,
    name: `${namePrefix}.chainOffers` as FieldArrayPath<ChainsListConfig>,
  });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((field) => field.id === active.id);
    const newIndex = fields.findIndex((field) => field.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    move(oldIndex, newIndex);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Chain Offers ({fields.length})
      </Typography>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}>
        <SortableContext
          items={fields.map((field) => field.id)}
          strategy={verticalListSortingStrategy}>
          {fields.map((field, offerIndex) => (
            <Box key={field.id}>
              <SortableOffer
                id={field.id}
                index={offerIndex}
                namePrefix={`${namePrefix}.chainOffers.${offerIndex}`}
                onRemove={() => remove(offerIndex)}
              />
              {offerIndex < fields.length - 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() =>
                      insert(offerIndex + 1, createDefaultOffer())
                    }>
                    Add Step Here
                  </Button>
                </Box>
              )}
            </Box>
          ))}
        </SortableContext>
      </DndContext>

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => append(createDefaultOffer())}>
        Add Offer
      </Button>
    </Box>
  );
};

const ChainCard: React.FC<{ namePrefix: string; index?: number }> = ({
  namePrefix,
  index,
}) => {
  const { control, setValue } = useFormContext<ChainsListConfig>();
  const options = useWatch({
    control,
    name: `${namePrefix}.options` as FieldPath<ChainsListConfig>,
  }) as Record<string, any> | undefined;
  const durationValue =
    (useWatch({
      control,
      name: `${namePrefix}.duration` as FieldPath<ChainsListConfig>,
    }) as number | undefined) ?? 0;
  const [durationUnit, setDurationUnit] = useState<DurationUnit>(() =>
    getDefaultDurationUnit(durationValue)
  );
  const durationAmount = formatDurationAmount(durationValue, durationUnit);
  const durationLabel = dayjs.duration(durationValue).humanize();

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {index !== undefined && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">Chain {index + 1}</Typography>
          <Typography variant="body2" color="textSecondary">
            Configure timing, weights, and featured hero/skin.
          </Typography>
        </Box>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Chain ID"
            fullWidth
            value={
              (useWatch({
                control,
                name: `${namePrefix}.chainId` as FieldPath<ChainsListConfig>,
              }) as string | undefined) ?? ''
            }
            onChange={(e) =>
              setValue(`${namePrefix}.chainId` as any, e.target.value, {
                shouldDirty: true,
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Duration"
            type="number"
            fullWidth
            value={durationAmount}
            inputProps={{ min: 0, step: 'any' }}
            helperText={`Stored: ${durationValue} ms • ${durationLabel}`}
            onChange={(e) =>
              setValue(
                `${namePrefix}.duration` as any,
                Math.round(
                  (Number(e.target.value) || 0) * durationUnitMs[durationUnit]
                ),
                { shouldDirty: true }
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 2 }}>
          <TextField
            select
            fullWidth
            label="Unit"
            value={durationUnit}
            onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}>
            {durationUnits.map((unit) => (
              <MenuItem key={unit.value} value={unit.value}>
                {unit.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Weight"
            type="number"
            fullWidth
            value={
              (useWatch({
                control,
                name: `${namePrefix}.weight` as FieldPath<ChainsListConfig>,
              }) as number | undefined) ?? 0
            }
            onChange={(e) =>
              setValue(`${namePrefix}.weight` as any, Number(e.target.value), {
                shouldDirty: true,
              })
            }
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label={getHeroLabel(options?.featuringHeroId, 'Featuring Hero')}
            select
            fullWidth
            value={options?.featuringHeroId ?? ''}
            onChange={(e) =>
              setValue(
                `${namePrefix}.options.featuringHeroId` as any,
                e.target.value === '' ? undefined : Number(e.target.value),
                { shouldDirty: true }
              )
            }
          >
            <MenuItem value="">
              <em>Pick hero</em>
            </MenuItem>
            {getHeroOptions(options?.featuringHeroId).map((hero) => (
              <MenuItem key={hero.heroId} value={hero.heroId}>
                {hero.name}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            fullWidth
            label="Featuring Skin ID"
            value={options?.featuringSkinId ?? ''}
            onChange={(e) =>
              setValue(
                `${namePrefix}.options.featuringSkinId` as any,
                e.target.value ? e.target.value : undefined,
                { shouldDirty: true }
              )
            }>
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {getSkinOptionsForHero(
              options?.featuringHeroId,
              options?.featuringSkinId
            ).map((skinId) => (
              <MenuItem key={skinId} value={skinId}>
                {skinId}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={Boolean(options?.hiddenRewards)}
                onChange={(e) =>
                  setValue(
                    `${namePrefix}.options.hiddenRewards` as any,
                    e.target.checked,
                    { shouldDirty: true }
                  )
                }
              />
            }
            label="Hidden Rewards"
          />
        </Grid>
      </Grid>

      <ChainOffersList namePrefix={namePrefix} />
    </Paper>
  );
};

const ChainList: React.FC<{ namePrefix: string }> = ({ namePrefix }) => {
  const { control } = useFormContext<ChainsListConfig>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${namePrefix}.chainList` as FieldArrayPath<ChainsListConfig>,
  });

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Chain List ({fields.length})
      </Typography>
      {fields.map((field, chainIndex) => (
        <Box key={field.id} sx={{ mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 11 }}>
              <ChainCard
                namePrefix={`${namePrefix}.chainList.${chainIndex}`}
                index={chainIndex}
              />
            </Grid>
            <Grid
              size={{ xs: 12, md: 1 }}
              sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton color="error" onClick={() => remove(chainIndex)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        </Box>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => append(createDefaultChain())}>
        Add Chain
      </Button>
    </Box>
  );
};

const ConditionsList: React.FC<{ namePrefix: string }> = ({ namePrefix }) => {
  const { control, setValue } = useFormContext<ChainsListConfig>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `${namePrefix}.Conditions` as FieldArrayPath<ChainsListConfig>,
  });
  const conditions = (useWatch({
    control,
    name: `${namePrefix}.Conditions` as FieldPath<ChainsListConfig>,
  }) || []) as Condition[];

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        Conditions ({fields.length})
      </Typography>
      {fields.map((field, conditionIndex) => {
        const condition = conditions[conditionIndex];
        const featureName = condition?.FeatureName;
        const relationValue = condition?.Relation || Relation.inc;
        const value = condition?.Value;
        const isMultiRelation =
          relationValue === Relation.inc || relationValue === Relation.exc;
        const heroValue = Array.isArray(value)
          ? value.length > 0
            ? Number(value[0])
            : ''
          : typeof value === 'number'
          ? value
          : typeof value === 'string' &&
            value !== '' &&
            !Number.isNaN(Number(value))
          ? Number(value)
          : '';
        const heroMultiValue = Array.isArray(value)
          ? value.map(Number).filter((val) => !Number.isNaN(val))
          : typeof value === 'number'
          ? [value]
          : typeof value === 'string' &&
            value !== '' &&
            !Number.isNaN(Number(value))
          ? [Number(value)]
          : [];
        const arenaValue = typeof value === 'number' ? value : '';
        const arenaMultiValue = Array.isArray(value)
          ? value.map(Number).filter((val) => !Number.isNaN(val))
          : typeof value === 'number'
          ? [value]
          : typeof value === 'string' &&
            value !== '' &&
            !Number.isNaN(Number(value))
          ? [Number(value)]
          : [];

        return (
          <Paper key={field.id} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Feature"
                  value={featureName || FeatureName.Heroes}
                  onChange={(e) => {
                    const nextFeatureName = e.target.value as FeatureName;
                    setValue(
                      `${namePrefix}.Conditions.${conditionIndex}.FeatureName` as any,
                      nextFeatureName,
                      { shouldDirty: true }
                    );
                    if (nextFeatureName === FeatureName.Skins) {
                      setValue(
                        `${namePrefix}.Conditions.${conditionIndex}.Value` as any,
                        [],
                        { shouldDirty: true }
                      );
                    }
                    if (nextFeatureName === FeatureName.Arena) {
                      const nextValue =
                        relationValue === Relation.inc ||
                        relationValue === Relation.exc
                          ? []
                          : '';
                      setValue(
                        `${namePrefix}.Conditions.${conditionIndex}.Value` as any,
                        nextValue,
                        { shouldDirty: true }
                      );
                    }
                  }}>
                  {Object.values(FeatureName).map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <TextField
                  select
                  fullWidth
                  label="Relation"
                  value={relationValue}
                  onChange={(e) => {
                    const nextRelation = e.target.value as Relation;
                    setValue(
                      `${namePrefix}.Conditions.${conditionIndex}.Relation` as any,
                      nextRelation,
                      { shouldDirty: true }
                    );
                    const normalized = parseConditionValue(
                      formatConditionValue(value ?? ''),
                      featureName,
                      { allowPartial: false, relation: nextRelation }
                    );
                    setValue(
                      `${namePrefix}.Conditions.${conditionIndex}.Value` as any,
                      normalized,
                      { shouldDirty: true }
                    );
                  }}>
                  {Object.values(Relation).map((relation) => (
                    <MenuItem key={relation} value={relation}>
                      {relation}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                {featureName === FeatureName.Skins ? (
                  <TextField
                    select
                    fullWidth
                    label="Skins"
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) =>
                        Array.isArray(selected)
                          ? selected.join(', ')
                          : String(selected),
                    }}
                    value={
                      Array.isArray(value)
                        ? value
                            .map(String)
                            .filter((skinId) => allSkinIds.includes(skinId))
                        : value
                        ? [String(value)].filter((skinId) =>
                            allSkinIds.includes(skinId)
                          )
                        : []
                    }
                    onChange={(e) =>
                      setValue(
                        `${namePrefix}.Conditions.${conditionIndex}.Value` as any,
                        Array.isArray(e.target.value)
                          ? e.target.value
                          : [String(e.target.value)],
                        { shouldDirty: true }
                      )
                    }>
                    {allSkinIds.map((skinId) => (
                      <MenuItem key={skinId} value={skinId}>
                        {skinId}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : featureName === FeatureName.Heroes ? (
                  <TextField
                    select
                    fullWidth
                    label="Hero"
                    SelectProps={{ multiple: isMultiRelation }}
                    value={isMultiRelation ? heroMultiValue : heroValue}
                    onChange={(e) =>
                      setValue(
                        `${namePrefix}.Conditions.${conditionIndex}.Value` as any,
                        isMultiRelation
                          ? Array.isArray(e.target.value)
                            ? e.target.value.map((entry) => Number(entry))
                            : [Number(e.target.value)]
                          : Number(e.target.value),
                        { shouldDirty: true }
                      )
                    }>
                    <MenuItem value="">
                      <em>Pick hero</em>
                    </MenuItem>
                    {HEROES.map((hero) => (
                      <MenuItem key={hero.heroId} value={hero.heroId}>
                        {hero.name}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : featureName === FeatureName.Arena ? (
                  <TextField
                    select
                    fullWidth
                    label="Arena"
                    helperText="Arena is indexed (0-12)."
                    SelectProps={{ multiple: isMultiRelation }}
                    value={isMultiRelation ? arenaMultiValue : arenaValue}
                    onChange={(e) =>
                      setValue(
                        `${namePrefix}.Conditions.${conditionIndex}.Value` as any,
                        isMultiRelation
                          ? Array.isArray(e.target.value)
                            ? e.target.value.map((entry) => Number(entry))
                            : [Number(e.target.value)]
                          : Number(e.target.value),
                        { shouldDirty: true }
                      )
                    }>
                    <MenuItem value="">
                      <em>Pick arena</em>
                    </MenuItem>
                    {arenaOptions.map((arenaValue) => (
                      <MenuItem key={arenaValue} value={arenaValue}>
                        {arenaValue}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    label="Value"
                    fullWidth
                    helperText="Use comma-separated list for arrays"
                    value={formatConditionValue(value ?? '')}
                    onChange={(e) =>
                      setValue(
                        `${namePrefix}.Conditions.${conditionIndex}.Value` as any,
                        parseConditionValue(e.target.value, featureName, {
                          allowPartial: true,
                          relation: relationValue,
                        }),
                        { shouldDirty: true }
                      )
                    }
                    onBlur={(e) =>
                      setValue(
                        `${namePrefix}.Conditions.${conditionIndex}.Value` as any,
                        parseConditionValue(e.target.value, featureName, {
                          allowPartial: false,
                          relation: relationValue,
                        }),
                        { shouldDirty: true }
                      )
                    }
                  />
                )}
              </Grid>
              <Grid
                size={{ xs: 12, md: 1 }}
                sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  color="error"
                  onClick={() => remove(conditionIndex)}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        );
      })}
      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() =>
          append({
            FeatureName: FeatureName.Heroes,
            Relation: Relation.inc,
            Value: [1],
          })
        }>
        Add Condition
      </Button>
    </Box>
  );
};

const GroupCard: React.FC<{ namePrefix: string; index?: number }> = ({
  namePrefix,
  index,
}) => {
  const { control, setValue } = useFormContext<ChainsListConfig>();

  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      {index !== undefined && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5">Group {index + 1}</Typography>
          <Typography variant="body2" color="textSecondary">
            Define conditions and attach chains for this segment.
          </Typography>
        </Box>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Group Max Select"
            type="number"
            fullWidth
            value={
              (useWatch({
                control,
                name: `${namePrefix}.maxSelect` as FieldPath<ChainsListConfig>,
              }) as number | undefined) ?? ''
            }
            onChange={(e) =>
              setValue(
                `${namePrefix}.maxSelect` as any,
                Number(e.target.value),
                { shouldDirty: true }
              )
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TextField
            label="Group Weight"
            type="number"
            fullWidth
            value={
              (useWatch({
                control,
                name: `${namePrefix}.weight` as FieldPath<ChainsListConfig>,
              }) as number | undefined) ?? ''
            }
            onChange={(e) =>
              setValue(`${namePrefix}.weight` as any, Number(e.target.value), {
                shouldDirty: true,
              })
            }
          />
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      <ConditionsList namePrefix={namePrefix} />

      <Divider sx={{ my: 3 }} />

      <ChainList namePrefix={namePrefix} />
    </Paper>
  );
};

export const ChainOfferCreator: React.FC = () => {
  const [viewMode, setViewMode] = useState<'json' | 'visual'>('visual');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [heroSwapValue, setHeroSwapValue] = useState<number | undefined>(
    undefined
  );

  const methods = useForm<ChainsListConfig>({
    defaultValues,
    mode: 'onChange',
  });

  const { control, reset, watch, getValues } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'chainsAndConditions',
  });

  const formValues = watch();
  const jsonPreview = useMemo(
    () => JSON.stringify(formValues, null, 2),
    [formValues]
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      tryParse(text);
    };
    reader.readAsText(file);
  };

  const tryParse = (text: string) => {
    try {
      const data = JSON.parse(text) as ChainsListConfig;
      if (data && Array.isArray(data.chainsAndConditions)) {
        reset(data);
        setJsonError(null);
        setViewMode('visual');
      } else {
        setJsonError('Invalid JSON structure.');
      }
    } catch (e) {
      setJsonError('Invalid JSON format');
    }
  };

  const handleExport = () => {
    const data = JSON.parse(JSON.stringify(getValues())) as ChainsListConfig;
    data.chainsAndConditions.forEach((group) => {
      group.chainList.forEach((chain) => {
        chain.chainOffers.forEach((offer) => {
          if (offer.cost) {
            delete offer.cost_IR;
            delete offer.cost_EU;
          }
          if (offer.cost_IR || offer.cost_EU) {
            delete offer.cost;
          }
        });
      });
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chain_offer_config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleHeroSwap = () => {
    if (typeof heroSwapValue !== 'number' || Number.isNaN(heroSwapValue)) return;

    const data = JSON.parse(JSON.stringify(getValues())) as ChainsListConfig;
    const heroRewardTypes = new Set([
      RewardType.HeroCard,
      RewardType.HeroAbilityCard,
      RewardType.Skin,
      RewardType.NewHero,
    ]);

    data.chainsAndConditions.forEach((group) => {
      group.Conditions.forEach((condition) => {
        if (condition.FeatureName === FeatureName.Heroes) {
          condition.Value =
            condition.Relation === Relation.inc ||
            condition.Relation === Relation.exc
              ? [heroSwapValue]
              : heroSwapValue;
        }
      });

      group.chainList.forEach((chain) => {
        chain.options = chain.options || {};
        chain.options.featuringHeroId = heroSwapValue;

        chain.chainOffers.forEach((offer) => {
          offer.rewards.forEach((reward) => {
            if (heroRewardTypes.has(reward.rewardType)) {
              reward.heroId = heroSwapValue;
            }
          });
        });
      });
    });

    reset(data);
  };

  return (
    <FormProvider {...methods}>
      <Container maxWidth="xl" sx={{ pb: 6 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ md: 'center' }}
            justifyContent="space-between">
            <Box>
              <Typography variant="h3" sx={{ mb: 0.5 }}>
                Chain Offer Command Center
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Assemble step-by-step offers with visual controls.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={viewMode === 'visual' ? 'Visual Mode' : 'JSON Mode'}
                color="primary"
                variant="outlined"
              />
              <Button
                variant="contained"
                component="label"
                startIcon={<UploadIcon />}>
                Upload JSON
                <input
                  type="file"
                  hidden
                  accept=".json"
                  onChange={handleFileUpload}
                />
              </Button>
              <Button
                variant="outlined"
                onClick={handleExport}
                startIcon={<DownloadIcon />}>
                Export
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant={viewMode === 'json' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('json')}
            startIcon={<CodeIcon />}>
            JSON
          </Button>
          <Button
            variant={viewMode === 'visual' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('visual')}
            startIcon={<ViewListIcon />}>
            Visual
          </Button>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ alignSelf: 'center', ml: 'auto' }}>
            Tip: Drag steps to reorder.
          </Typography>
        </Paper>

        <Paper sx={{ p: 2.5, mb: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ md: 'center' }}
            justifyContent="space-between">
            <TextField
              label={getHeroLabel(heroSwapValue, 'Change by Hero')}
              select
              sx={{ minWidth: { xs: '100%', md: 260 } }}
              value={heroSwapValue ?? ''}
              onChange={(e) =>
                setHeroSwapValue(
                  e.target.value === '' ? undefined : Number(e.target.value)
                )
              }>
              <MenuItem value="">
                <em>Pick hero</em>
              </MenuItem>
              {getHeroOptions(heroSwapValue).map((hero) => (
                <MenuItem key={hero.heroId} value={hero.heroId}>
                  {hero.name}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<SwapHorizIcon />}
              onClick={handleHeroSwap}>
              Apply Hero Change
            </Button>
            <Alert severity="info" sx={{ flex: 1 }}>
              Updates hero conditions, offer rewards with heroId, and
              featuringHeroId options.
            </Alert>
          </Stack>
        </Paper>

        {jsonError && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee', color: '#c62828' }}>
            <Typography>{jsonError}</Typography>
          </Paper>
        )}

        {viewMode === 'json' ? (
          <TextField
            fullWidth
            multiline
            minRows={20}
            variant="outlined"
            value={jsonPreview}
            onChange={(e) => tryParse(e.target.value)}
            sx={{ bgcolor: 'white', fontFamily: 'monospace' }}
          />
        ) : (
          <Box>
            <Typography color="primary" variant="h6" gutterBottom>
              Chain Groups ({fields.length})
            </Typography>

            {fields.map((field, groupIndex) => (
              <Box key={field.id} sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid size={{ xs: 12, md: 11 }}>
                    <GroupCard
                      namePrefix={`chainsAndConditions.${groupIndex}`}
                      index={groupIndex}
                    />
                  </Grid>
                  <Grid
                    size={{ xs: 12, md: 1 }}
                    sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                      color="error"
                      onClick={() => remove(groupIndex)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => append(createDefaultGroup())}>
              Add Group
            </Button>
          </Box>
        )}
      </Container>
    </FormProvider>
  );
};
