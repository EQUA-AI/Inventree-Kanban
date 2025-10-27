import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import { SimpleGrid, Skeleton } from '@mantine/core';
import { useCallback } from 'react';

import type { KanbanColumn } from '../types';
import { KanbanColumnView } from './KanbanColumnView';

interface KanbanBoardProps {
  columns: KanbanColumn[];
  onMove: (
    cardId: string,
    source: string,
    destination: string
  ) => Promise<void> | void;
  loading?: boolean;
}

export function KanbanBoard({ columns, onMove, loading }: KanbanBoardProps) {
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) {
        return;
      }

      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      void onMove(draggableId, source.droppableId, destination.droppableId);
    },
    [onMove]
  );

  if (loading) {
    return (
      <SimpleGrid
        cols={{ base: 1, md: Math.min(3, columns.length), xl: columns.length }}
        spacing='lg'
      >
        {columns.map((column) => (
          <Skeleton key={column.id} height={320} radius='md' />
        ))}
      </SimpleGrid>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <SimpleGrid
        cols={{ base: 1, md: Math.min(3, columns.length), xl: columns.length }}
        spacing='lg'
      >
        {columns.map((column) => (
          <KanbanColumnView key={column.id} column={column} />
        ))}
      </SimpleGrid>
    </DragDropContext>
  );
}
