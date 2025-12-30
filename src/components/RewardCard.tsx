import React from 'react';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import {
  Card,
  CardContent,
  TextField,
  MenuItem,
  Typography,
  IconButton,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // NOTE: Using Grid2 for MUI v6
import DeleteIcon from '@mui/icons-material/Delete';
import { RewardType, chestType } from '../types/models';
import type { RewardEntryInput } from '../types/models'; // FIXED: Type-only import
import { getHeroLabel } from '../types/heroModels';
import { validateRewardEntry } from '../utils/validator';

interface Props {
  index: number;
  onRemove: () => void;
}

const RewardCardComponent: React.FC<Props> = ({ index, onRemove }) => {
  const { control } = useFormContext();

  const itemData = useWatch({
    control,
    name: `items.${index}`,
  }) as RewardEntryInput;

  const errors = itemData ? validateRewardEntry(itemData) : [];
  const hasError = errors.length > 0;
  const rewardType = itemData?.reward?.rewardType;

  const renderField = (
    name: string,
    label: string,
    type: string = 'text',
    selectOptions?: any[]
  ) => (
    <Controller
      name={`items.${index}.${name}`}
      control={control}
      defaultValue=''
      render={({ field }) => (
        <TextField
          {...field}
          label={label}
          type={type !== 'select' ? type : undefined}
          select={type === 'select'}
          fullWidth
          onChange={(e) => {
            const val =
              type === 'number' ? Number(e.target.value) : e.target.value;
            field.onChange(val);
          }}>
          {selectOptions}
        </TextField>
      )}
    />
  );

  const renderDynamicFields = () => {
    switch (rewardType) {
      case RewardType.Gem:
      case RewardType.Gold:
        return (
          <Grid size={{ xs: 6 }}>
            {renderField('reward.amount', 'Amount', 'number')}
          </Grid>
        );
      case RewardType.Chest:
        return (
          <>
            <Grid size={{ xs: 6 }}>
              {renderField('reward.amount', 'Amount', 'number')}
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Controller
                name={`items.${index}.reward.chestType`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    fullWidth
                    label='Chest Type'
                    onChange={(e) => field.onChange(Number(e.target.value))}>
                    {Object.keys(chestType)
                      .filter((k) => isNaN(Number(k)))
                      .map((key) => (
                        <MenuItem
                          key={key}
                          value={chestType[key as keyof typeof chestType]}>
                          {key}
                        </MenuItem>
                      ))}
                  </TextField>
                )}
              />
            </Grid>
          </>
        );
      case RewardType.HeroAbilityCard:
        const isRandom = itemData?.reward?.heroId === -1;
        const isUltimate = itemData?.reward?.ability === 'ab3';
        const heroIdHasError =
          (isRandom && isUltimate) || errors.some((e) => e.includes('Hero ID'));

        return (
          <>
            <Grid size={{ xs: 4 }}>
              {renderField('reward.cardAmount', 'Card Amount', 'number')}
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Controller
                name={`items.${index}.reward.heroId`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label={getHeroLabel(itemData?.reward?.heroId)}
                    type='number'
                    error={heroIdHasError}
                    helperText={
                      isRandom
                        ? isUltimate
                          ? 'Warning: -1 usually invalid for Ab3'
                          : 'Random card for ability'
                        : ''
                    }
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <Controller
                name={`items.${index}.reward.ability`}
                control={control}
                render={({ field }) => (
                  <TextField {...field} select fullWidth label='Ability'>
                    <MenuItem value='ab1'>ab1</MenuItem>
                    <MenuItem value='ab2'>ab2</MenuItem>
                    <MenuItem value='ab3'>ab3</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            {isRandom && !isUltimate && (
              <Grid size={{ xs: 12 }}>
                <Alert severity='info' sx={{ py: 0 }}>
                  Hero ID -1: Random cards for{' '}
                  <strong>{itemData.reward.ability || '...'}</strong>.
                </Alert>
              </Grid>
            )}
          </>
        );
      default:
        return (
          <Grid size={{ xs: 6 }}>
            {renderField('reward.amount', 'Amount (Generic)', 'number')}
          </Grid>
        );
    }
  };

  if (!itemData) return null;

  return (
    <Card sx={{ mb: 2, border: hasError ? '2px solid red' : '1px solid #ddd' }}>
      <CardContent>
        <Grid container spacing={2} alignItems='center'>
          <Grid size={{ xs: 12 }}>
            {hasError && (
              <Alert severity='error' sx={{ mb: 1 }}>
                {errors.map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
              </Alert>
            )}
          </Grid>

          <Grid size={{ xs: 3 }}>
            <Controller
              name={`items.${index}.id`}
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label='ID'
                  fullWidth
                  error={!!fieldState.error}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 3 }}>
            {renderField('requiredPoint', 'Required Point', 'number')}
          </Grid>

          <Grid size={{ xs: 6 }}>
            <Controller
              name={`items.${index}.reward.rewardType`}
              control={control}
              render={({ field }) => (
                <TextField {...field} select fullWidth label='Reward Type'>
                  {Object.values(RewardType).map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {renderDynamicFields()}

          <Grid
            size={{ xs: 12 }}
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mt: 1,
            }}>
            <Typography variant='caption' color='text.secondary'>
              Item Index: {index}
            </Typography>
            <IconButton color='error' onClick={onRemove}>
              <DeleteIcon />
            </IconButton>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export const RewardCard = React.memo(RewardCardComponent);
RewardCard.displayName = 'RewardCard';
