export type OrderType = 'build' | 'purchase' | 'sales';

export type ColumnKey =
  | 'BACKLOG'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'REVIEW'
  | 'DONE';
export type CardPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface KanbanCard {
  id: number | string;
  type: OrderType;
  reference: string;
  title: string;
  status: string;
  normalizedStatus: ColumnKey;
  dueDate?: string;
  assignee?: string;
  priority?: CardPriority;
  userColor?: string;
  link?: string;
  description?: string;
  meta?: Record<string, unknown>;
}

export interface KanbanColumn {
  id: ColumnKey;
  title: string;
  description: string;
  cards: KanbanCard[];
}

export interface NewCardInput {
  type: OrderType;
  column: ColumnKey;
  reference: string;
  title: string;
  dueDate?: string;
  assignee?: string;
  priority?: CardPriority;
}

export interface UserColorSettings {
  explicitMap: Record<string, string>;
  palette: string[];
}

export interface KanbanSettings {
  enableBuild: boolean;
  enablePurchase: boolean;
  enableSales: boolean;
  userColors: UserColorSettings | null;
}
