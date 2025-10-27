import type { ColumnKey, OrderType } from '../types';

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  build: 'Build Orders',
  purchase: 'Purchase Orders',
  sales: 'Sales Orders'
};

export const ORDER_TYPES: OrderType[] = ['build', 'purchase', 'sales'];

export const COLUMN_DEFINITIONS: Array<{
  id: ColumnKey;
  title: string;
  description: string;
}> = [
  {
    id: 'BACKLOG',
    title: 'Backlog',
    description: 'New or pending orders awaiting action'
  },
  {
    id: 'IN_PROGRESS',
    title: 'In Progress',
    description: 'Active work currently underway'
  },
  {
    id: 'ON_HOLD',
    title: 'On Hold',
    description: 'Orders blocked or paused for review'
  },
  {
    id: 'REVIEW',
    title: 'Review',
    description: 'Receiving, QA, or closing checks required'
  },
  { id: 'DONE', title: 'Done', description: 'Completed or closed orders' }
];

type StatusPayload = {
  label: string;
  value: number;
};

type StatusMap = Record<
  ColumnKey,
  { values: string[]; payload: StatusPayload }
>;

const STATUS_MAPPING: Record<OrderType, StatusMap> = {
  build: {
    BACKLOG: {
      values: ['PENDING', 'PRE_PRODUCTION', 'PLANNING'],
      payload: { label: 'Pending', value: 10 }
    },
    IN_PROGRESS: {
      values: ['IN_PROGRESS', 'PRODUCTION', 'BUILDING'],
      payload: { label: 'In production', value: 20 }
    },
    ON_HOLD: {
      values: ['HOLD', 'ON_HOLD', 'PAUSED'],
      payload: { label: 'On hold', value: 40 }
    },
    REVIEW: {
      values: ['COMPLETE_PENDING', 'AWAITING_COMPLETION', 'READY_TO_COMPLETE'],
      payload: { label: 'Awaiting completion', value: 50 }
    },
    DONE: {
      values: ['COMPLETE', 'COMPLETED', 'FINISHED'],
      payload: { label: 'Completed', value: 60 }
    }
  },
  purchase: {
    BACKLOG: {
      values: ['DRAFT', 'PENDING', 'PRE_ORDER'],
      payload: { label: 'Pending', value: 10 }
    },
    IN_PROGRESS: {
      values: ['ORDERED', 'PLACED', 'ISSUED'],
      payload: { label: 'Placed', value: 20 }
    },
    ON_HOLD: {
      values: ['HOLD', 'ON_HOLD', 'DELAYED'],
      payload: { label: 'On hold', value: 30 }
    },
    REVIEW: {
      values: ['RECEIVING', 'AWAITING_RECEIPT', 'INSPECTION'],
      payload: { label: 'Receiving', value: 40 }
    },
    DONE: {
      values: ['RECEIVED', 'COMPLETE', 'CLOSED'],
      payload: { label: 'Completed', value: 50 }
    }
  },
  sales: {
    BACKLOG: {
      values: ['PENDING', 'QUOTED', 'DRAFT'],
      payload: { label: 'Pending', value: 10 }
    },
    IN_PROGRESS: {
      values: ['ALLOCATING', 'IN_PROGRESS', 'FULFILLING', 'PICKING'],
      payload: { label: 'Allocating', value: 20 }
    },
    ON_HOLD: {
      values: ['HOLD', 'ON_HOLD', 'BLOCKED'],
      payload: { label: 'On hold', value: 30 }
    },
    REVIEW: {
      values: ['PACKING', 'READY_TO_SHIP', 'AWAITING_SHIPMENT'],
      payload: { label: 'Packing', value: 40 }
    },
    DONE: {
      values: ['SHIPPED', 'COMPLETED', 'CLOSED'],
      payload: { label: 'Completed', value: 50 }
    }
  }
};

function normalizeStatus(value: unknown) {
  if (value == null) {
    return '';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return String(value)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/gi, '')
    .toUpperCase();
}

export function mapNativeToColumn(
  type: OrderType,
  nativeStatus: unknown
): ColumnKey {
  const status = normalizeStatus(nativeStatus);
  const mapping = STATUS_MAPPING[type];

  for (const [column, config] of Object.entries(mapping) as Array<
    [ColumnKey, StatusMap[ColumnKey]]
  >) {
    if (
      config.values.includes(status) ||
      config.payload.value === Number(nativeStatus)
    ) {
      return column;
    }
  }

  return 'BACKLOG';
}

export function mapColumnToNative(
  type: OrderType,
  column: ColumnKey
): StatusPayload {
  return STATUS_MAPPING[type][column].payload;
}

export function getColumnDefinition(column: ColumnKey) {
  return COLUMN_DEFINITIONS.find((definition) => definition.id === column);
}
