import React, { useMemo, useState } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Stack,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // NOTE: using Grid2 for MUI v6 compatibility
import UploadIcon from '@mui/icons-material/Upload';
import DownloadIcon from '@mui/icons-material/Download';
import CodeIcon from '@mui/icons-material/Code';
import ViewListIcon from '@mui/icons-material/ViewList';
import AddIcon from '@mui/icons-material/Add';

import { RewardCard } from '../components/RewardCard';
import type { RewardFileStructure, RewardEntryInput } from '../types/models';
import { RewardType } from '../types/models';

export const RewardEditor: React.FC = () => {
  const [viewMode, setViewMode] = useState<'json' | 'visual'>('json');
  const [jsonError, setJsonError] = useState<string | null>(null);

  const methods = useForm<RewardFileStructure>({
    defaultValues: {
      pointTomanRate: 0,
      items: [],
    },
    mode: 'onChange',
  });

  const { control, reset, watch, getValues } = methods;

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
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
      const data = JSON.parse(text);
      if (
        typeof data === 'object' &&
        (Array.isArray(data.items) || Array.isArray(data))
      ) {
        const validData = Array.isArray(data)
          ? { pointTomanRate: 0, items: data }
          : data;

        reset(validData);
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
    const data = getValues();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'rewards_config.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddNew = () => {
    append({
      id: `new-item-${Date.now()}`,
      requiredPoint: 0,
      reward: { rewardType: RewardType.Gold, amount: 100 },
    } as RewardEntryInput);
  };

  return (
    <FormProvider {...methods}>
      <Container maxWidth='xl' sx={{ pb: 6 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ md: 'center' }}
            justifyContent='space-between'>
            <Box>
              <Typography variant='h3' sx={{ mb: 0.5 }}>
                Reward Data Studio
              </Typography>
              <Typography variant='body2' color='textSecondary'>
                Upload, inspect, and fine-tune reward tables.
              </Typography>
            </Box>
            <Stack direction='row' spacing={1} alignItems='center'>
              <Chip
                label={viewMode === 'visual' ? 'Visual Mode' : 'JSON Mode'}
                color='primary'
                variant='outlined'
              />
              <Button
                variant='contained'
                component='label'
                startIcon={<UploadIcon />}>
                Upload JSON
                <input type='file' hidden accept='.json' onChange={handleFileUpload} />
              </Button>
              <Button
                variant='outlined'
                onClick={handleExport}
                startIcon={<DownloadIcon />}>
                Export
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper
          sx={{
            p: 2,
            mb: 3,
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
          }}>
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
            variant='body2'
            color='textSecondary'
            sx={{ alignSelf: 'center', ml: 'auto' }}>
            Tip: Switch to JSON for bulk edits.
          </Typography>
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
            variant='outlined'
            value={jsonPreview}
            onChange={(e) => tryParse(e.target.value)}
            sx={{ bgcolor: 'white', fontFamily: 'monospace' }}
          />
        ) : (
          <Box>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant='h6' gutterBottom>
                Global Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    label='Point Toman Rate'
                    type='number'
                    fullWidth
                    {...methods.register('pointTomanRate', {
                      valueAsNumber: true,
                    })}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ md: 'center' }}
              justifyContent='space-between'
              sx={{ mb: 2 }}>
              <Typography variant='h6'>
                Reward Items ({fields.length})
              </Typography>
              <Button
                variant='contained'
                startIcon={<AddIcon />}
                onClick={handleAddNew}>
                Add Item
              </Button>
            </Stack>

            {fields.map((field, index) => (
              <RewardCard
                key={field.id}
                index={index}
                onRemove={() => remove(index)}
              />
            ))}

            {fields.length === 0 && (
              <Typography sx={{ mb: 2 }}>No items.</Typography>
            )}
          </Box>
        )}
      </Container>
    </FormProvider>
  );
};
