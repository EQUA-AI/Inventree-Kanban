import { Droppable } from '@hello-pangea/dnd';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';

import type { KanbanColumn } from '../types';
import { KanbanCardView } from './KanbanCardView';

interface KanbanColumnViewProps {
  column: KanbanColumn;
}

export function KanbanColumnView({ column }: KanbanColumnViewProps) {
  return (
    <Droppable droppableId={column.id}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.droppableProps}
          withBorder
          shadow='sm'
          radius='md'
          p='md'
          bg={snapshot.isDraggingOver ? 'gray.0' : 'white'}
          h='100%'
        >
          <Group justify='space-between' mb='md'>
            <div>
              <Text fw={600}>{column.title}</Text>
              <Text size='sm' c='dimmed'>
                {column.description}
              </Text>
            </div>
            <Badge color='blue' variant='light'>
              {column.cards.length}
            </Badge>
          </Group>

          <Stack gap='sm'>
            {column.cards.map((card, index) => (
              <KanbanCardView key={card.id} card={card} index={index} />
            ))}
            {provided.placeholder}
          </Stack>
        </Paper>
      )}
    </Droppable>
  );
}
