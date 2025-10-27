import {
  ApiEndpoints,
  apiUrl,
  getDetailUrl,
  type InvenTreePluginContext,
  ModelType
} from '@inventreedb/ui';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  CardPriority,
  ColumnKey,
  KanbanCard,
  KanbanColumn,
  KanbanSettings,
  OrderType
} from '../types';
import { resolveUserColor } from '../utils/color';
import {
  COLUMN_DEFINITIONS,
  getColumnDefinition,
  mapColumnToNative,
  mapNativeToColumn,
  ORDER_TYPE_LABELS,
  ORDER_TYPES
} from '../utils/statusMapping';

export const KANBAN_ORDER_ENDPOINTS: Record<OrderType, ApiEndpoints> = {
  build: ApiEndpoints.build_order_list,
  purchase: ApiEndpoints.purchase_order_list,
  sales: ApiEndpoints.sales_order_list
};

const ORDER_MODEL: Record<OrderType, ModelType> = {
  build: ModelType.build,
  purchase: ModelType.purchaseorder,
  sales: ModelType.salesorder
};

type RawSettings = {
  ENABLE_BUILD?: boolean | string | number;
  ENABLE_PURCHASE?: boolean | string | number;
  ENABLE_SALES?: boolean | string | number;
  USER_COLOR_MAP?: string | Record<string, string>;
  USER_COLOR_FALLBACK_PALETTE?: string | string[];
};

function coerceBoolean(value: unknown, fallback: boolean) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off', 'n'].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

function parseJson<T>(input: unknown, fallback: T): T {
  if (input == null) {
    return fallback;
  }

  if (typeof input === 'object') {
    return input as T;
  }

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return parsed as T;
    } catch (error) {
      console.warn('Failed to parse plugin setting JSON value', error);
      return fallback;
    }
  }

  return fallback;
}

function parseSettings(raw: any): KanbanSettings {
  const source: RawSettings = (raw?.settings ?? raw ?? {}) as RawSettings;

  const enableBuild = coerceBoolean(source.ENABLE_BUILD, true);
  const enablePurchase = coerceBoolean(source.ENABLE_PURCHASE, true);
  const enableSales = coerceBoolean(source.ENABLE_SALES, true);

  const explicitMap = parseJson<Record<string, string>>(
    source.USER_COLOR_MAP,
    {}
  );
  const palette = parseJson<string[]>(source.USER_COLOR_FALLBACK_PALETTE, []);

  const userColors =
    Object.keys(explicitMap).length > 0 || palette.length > 0
      ? {
          explicitMap,
          palette
        }
      : null;

  return {
    enableBuild,
    enablePurchase,
    enableSales,
    userColors
  } satisfies KanbanSettings;
}

function normalisePriority(value: unknown): CardPriority | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'number') {
    if (value <= 1) {
      return 'low';
    }
    if (value === 2) {
      return 'medium';
    }
    if (value === 3) {
      return 'high';
    }
    return 'urgent';
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['low', 'medium', 'high', 'urgent'].includes(normalized)) {
      return normalized as CardPriority;
    }
    if (['critical', 'highest', 'rush'].includes(normalized)) {
      return 'urgent';
    }
    if (['normal', 'standard'].includes(normalized)) {
      return 'medium';
    }
  }

  return undefined;
}

function extractAssignee(data: any): string | undefined {
  const candidates = [
    data?.responsible_detail?.label,
    data?.responsible_detail?.name,
    data?.responsible_detail?.username,
    data?.responsible_name,
    data?.responsible,
    data?.assigned_to_detail?.label,
    data?.assigned_to_detail?.name,
    data?.assigned_to,
    data?.owner_detail?.label,
    data?.owner_detail?.name,
    data?.owner,
    data?.user_detail?.label,
    data?.user_detail?.name
  ];

  return candidates
    .find((value) => typeof value === 'string' && value.trim().length > 0)
    ?.trim();
}

function extractDueDate(data: any): string | undefined {
  const due =
    data?.target_date ??
    data?.due_date ??
    data?.required_date ??
    data?.expected_date;

  if (!due) {
    return undefined;
  }

  const parsed = dayjs(due);
  return parsed.isValid() ? parsed.toISOString() : undefined;
}

function extractReference(type: OrderType, data: any): string {
  const candidates = [
    data?.reference,
    data?.code,
    data?.order_reference,
    data?.customer_reference,
    data?.supplier_reference,
    `${ORDER_TYPE_LABELS[type]} #${data?.pk ?? data?.id}`
  ];

  const reference = candidates.find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
  return reference
    ? reference.trim()
    : `${type.toUpperCase()}-${data?.pk ?? data?.id}`;
}

function extractTitle(data: any): string {
  const candidates = [
    data?.title,
    data?.description,
    data?.notes,
    data?.detail,
    data?.summary
  ];

  const title = candidates.find(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
  return title ? title.trim() : 'No description provided';
}

function normaliseStatus(data: any): string {
  const options = [
    data?.status_text,
    data?.status_label,
    data?.status_display,
    data?.status_name,
    data?.status
  ];

  const status = options.find((value) => value != null);
  return status == null ? 'Unknown' : String(status);
}

function normaliseCard(
  type: OrderType,
  data: any,
  userColors: KanbanSettings['userColors']
): KanbanCard {
  const id = data?.pk ?? data?.id;
  const status = normaliseStatus(data);
  const normalizedStatus = mapNativeToColumn(type, status);

  const assignee = extractAssignee(data);

  const userColor = resolveUserColor(
    assignee,
    userColors?.explicitMap,
    userColors?.palette
  );

  const modelType = ORDER_MODEL[type];
  const link = getDetailUrl(modelType, id, true);

  return {
    id,
    type,
    reference: extractReference(type, data),
    title: extractTitle(data),
    status,
    normalizedStatus,
    dueDate: extractDueDate(data),
    assignee,
    priority: normalisePriority(data?.priority),
    userColor,
    link,
    description: data?.description,
    meta: data
  } satisfies KanbanCard;
}

function createEmptyColumns(): Record<ColumnKey, KanbanCard[]> {
  return COLUMN_DEFINITIONS.reduce<Record<ColumnKey, KanbanCard[]>>(
    (accumulator, definition) => {
      accumulator[definition.id] = [];
      return accumulator;
    },
    {} as Record<ColumnKey, KanbanCard[]>
  );
}

export function useKanbanData(context: InvenTreePluginContext) {
  const settings = useMemo(
    () => parseSettings(context.context),
    [context.context]
  );

  const enabledTypes = useMemo(() => {
    const result: OrderType[] = [];

    if (settings.enableBuild) {
      result.push('build');
    }
    if (settings.enablePurchase) {
      result.push('purchase');
    }
    if (settings.enableSales) {
      result.push('sales');
    }

    return result.length > 0 ? result : ORDER_TYPES;
  }, [settings.enableBuild, settings.enablePurchase, settings.enableSales]);

  const [cards, setCards] = useState<KanbanCard[]>([]);
  const cardsRef = useRef<KanbanCard[]>(cards);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  useEffect(() => {
    cardsRef.current = cards;
  }, [cards]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const responses = await Promise.all(
        enabledTypes.map(async (type) => {
          const endpoint = KANBAN_ORDER_ENDPOINTS[type];
          const response = await context.api.get(apiUrl(endpoint), {
            params: { limit: 250 }
          });

          const raw = Array.isArray(response?.data)
            ? response.data
            : (response?.data?.results ?? []);

          return raw.map((item: any) =>
            normaliseCard(type, item, settings.userColors)
          );
        })
      );

      const merged = responses.flat();

      merged.sort((a, b) => {
        const left = a.dueDate ? dayjs(a.dueDate) : null;
        const right = b.dueDate ? dayjs(b.dueDate) : null;

        if (left && right) {
          return left.valueOf() - right.valueOf();
        }

        if (left) {
          return -1;
        }
        if (right) {
          return 1;
        }
        return String(a.reference).localeCompare(String(b.reference));
      });

      setCards(merged);
      setLastUpdated(Date.now());
    } catch (err) {
      const message =
        err instanceof Error ? err : new Error('Failed to load kanban data');
      setError(message);
      notifications.show({
        title: 'Load failed',
        message: message.message,
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  }, [context.api, enabledTypes, settings.userColors]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const groupedColumns: KanbanColumn[] = useMemo(() => {
    const grouped = createEmptyColumns();

    cards.forEach((card) => {
      grouped[card.normalizedStatus] = [
        ...grouped[card.normalizedStatus],
        card
      ];
    });

    return COLUMN_DEFINITIONS.map((definition) => ({
      id: definition.id,
      title: definition.title,
      description: definition.description,
      cards: grouped[definition.id]
    }));
  }, [cards]);

  const moveCard = useCallback(
    async (cardId: string | number, destination: ColumnKey) => {
      const identifier = String(cardId);
      const existing = cardsRef.current.find(
        (card) => String(card.id) === identifier
      );

      if (!existing) {
        return;
      }

      const nextStatus = mapColumnToNative(existing.type, destination);
      const columnTitle =
        getColumnDefinition(destination)?.title ?? destination;

      const previous = cardsRef.current.map((card) => ({ ...card }));

      setCards((current) =>
        current.map((card) =>
          String(card.id) === identifier
            ? {
                ...card,
                status: nextStatus.label,
                normalizedStatus: destination
              }
            : card
        )
      );

      try {
        await context.api.patch(
          apiUrl(KANBAN_ORDER_ENDPOINTS[existing.type], existing.id),
          {
            status: nextStatus.value,
            status_text: nextStatus.label
          }
        );

        notifications.show({
          title: 'Status updated',
          message: `${existing.reference} moved to ${columnTitle}`,
          color: 'green'
        });
      } catch (err) {
        setCards(previous);
        notifications.show({
          title: 'Move failed',
          message:
            err instanceof Error
              ? err.message
              : 'The new status could not be saved. Changes have been reverted.',
          color: 'red'
        });
        throw err;
      }
    },
    [context.api]
  );

  const totalCards = useMemo(
    () =>
      groupedColumns.reduce((total, column) => total + column.cards.length, 0),
    [groupedColumns]
  );

  return {
    columns: groupedColumns,
    loading,
    error,
    refresh,
    moveCard,
    totalCards,
    lastUpdated,
    enabledTypes,
    settings
  } as const;
}
