import {
  apiUrl,
  checkPluginVersion,
  type InvenTreePluginContext
} from '@inventreedb/ui';
import { t } from '@lingui/core/macro';
import {
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Menu,
  Paper,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useCallback, useMemo } from 'react';
import { KanbanBoard } from './components/KanbanBoard';
import { KANBAN_ORDER_ENDPOINTS, useKanbanData } from './hooks/useKanbanData';
import { LocalizedComponent } from './locale';
import type { ColumnKey, OrderType } from './types';
import { ORDER_TYPE_LABELS } from './utils/statusMapping';

function WorkOrderKanbanPanel({
  context
}: {
  context: InvenTreePluginContext;
}) {
  const {
    columns,
    loading,
    error,
    refresh,
    moveCard,
    totalCards,
    lastUpdated,
    enabledTypes
  } = useKanbanData(context);

  const formattedUpdatedAt = useMemo(() => {
    if (!lastUpdated) {
      return null;
    }

    return dayjs(lastUpdated).format('MMM D, HH:mm');
  }, [lastUpdated]);

  const handleRefresh = useCallback(() => {
    void refresh();
  }, [refresh]);

  const handleMove = useCallback(
    async (cardId: string, _source: string, destination: string) => {
      await moveCard(cardId, destination as ColumnKey);
    },
    [moveCard]
  );

  const openCreateForm = useCallback(
    (type: OrderType) => {
      const endpoint = KANBAN_ORDER_ENDPOINTS[type];
      const form = context.forms.create({
        url: apiUrl(endpoint),
        title: `New ${ORDER_TYPE_LABELS[type].replace(/s$/, '')}`,
        successMessage: null,
        onFormSuccess: () => {
          void refresh();
        }
      });

      form?.open();
    },
    [context.forms, refresh]
  );

  return (
    <ModalsProvider>
      <Notifications />
      <Stack gap='lg'>
        <Paper withBorder p='lg' radius='md' shadow='xs'>
          <Stack gap='sm'>
            <Group justify='space-between' align='flex-start'>
              <div>
                <Title order={3} c={context.theme.primaryColor}>
                  Work Order Kanban
                </Title>
                <Text c='dimmed' size='sm'>
                  {t`Unified board for build, purchase, and sales orders. Drag cards to move items between stages.`}
                </Text>
              </div>
              <Group gap='xs'>
                <Button
                  variant='default'
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  {loading ? t`Refreshing…` : t`Refresh`}
                </Button>
                <Menu shadow='md' width={220} withinPortal>
                  <Menu.Target>
                    <Button>{t`New order`}</Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {enabledTypes.map((type) => (
                      <Menu.Item
                        key={type}
                        onClick={() => openCreateForm(type)}
                      >
                        {ORDER_TYPE_LABELS[type]}
                      </Menu.Item>
                    ))}
                  </Menu.Dropdown>
                </Menu>
              </Group>
            </Group>

            <Group gap='xs'>
              <Badge color='blue' variant='filled'>
                {`${totalCards} cards`}
              </Badge>
              <Badge color='gray' variant='light'>
                {t`Types:`}{' '}
                {enabledTypes.map((type) => ORDER_TYPE_LABELS[type]).join(', ')}
              </Badge>
              {formattedUpdatedAt && (
                <Badge color='teal' variant='light'>
                  {`Updated ${formattedUpdatedAt}`}
                </Badge>
              )}
            </Group>

            {error && (
              <Alert color='red' variant='light' title={t`Unable to load data`}>
                {error.message}
              </Alert>
            )}
          </Stack>
        </Paper>

        <Box>
          <KanbanBoard
            columns={columns}
            onMove={handleMove}
            loading={loading}
          />
        </Box>
      </Stack>
    </ModalsProvider>
  );
}

export function renderWorkOrderKanbanPanel(context: InvenTreePluginContext) {
  checkPluginVersion(context);

  return (
    <LocalizedComponent locale={context.locale}>
      <WorkOrderKanbanPanel context={context} />
    </LocalizedComponent>
  );
}
