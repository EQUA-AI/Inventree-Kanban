import { Draggable } from '@hello-pangea/dnd';
import { Badge, Group, Paper, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';

import type { CardPriority, KanbanCard } from '../types';
import { idealTextColor } from '../utils/color';

interface KanbanCardViewProps {
  card: KanbanCard;
  index: number;
}

const PRIORITY_COLOR: Record<CardPriority, string> = {
  low: 'gray',
  medium: 'cyan',
  high: 'orange',
  urgent: 'red'
};

export function KanbanCardView({ card, index }: KanbanCardViewProps) {
  const dueDate = card.dueDate
    ? dayjs(card.dueDate).format('MMM D')
    : undefined;
  const accent = card.userColor;
  const accentText = idealTextColor(accent);

  return (
    <Draggable draggableId={String(card.id)} index={index}>
      {(provided, snapshot) => (
        <Paper
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          radius='md'
          withBorder
          shadow={snapshot.isDragging ? 'lg' : 'xs'}
          p='md'
          style={{
            ...provided.draggableProps.style,
            borderLeft: accent ? `6px solid ${accent}` : undefined,
            backgroundColor: snapshot.isDragging ? '#edf2ff' : 'white',
            transition: snapshot.isDragging
              ? (provided.draggableProps.style?.transition ?? 'none')
              : 'transform 160ms ease, box-shadow 160ms ease, background-color 160ms ease'
          }}
        >
          <Stack gap='xs'>
            <Group justify='space-between'>
              <Text fw={600}>{card.reference}</Text>
              <Badge color='blue' variant='light'>
                {card.type.toUpperCase()}
              </Badge>
            </Group>

            <Text size='sm'>{card.title}</Text>

            <Group gap='xs'>
              {card.assignee && (
                <Badge
                  color={accent ? undefined : 'gray'}
                  variant='filled'
                  bg={accent}
                  c={accent ? accentText : undefined}
                >
                  {card.assignee}
                </Badge>
              )}
              <Badge color='grape' variant='light'>
                {card.status}
              </Badge>
              {card.priority && (
                <Badge color={PRIORITY_COLOR[card.priority]} variant='filled'>
                  {card.priority.toUpperCase()}
                </Badge>
              )}
              {dueDate && (
                <Badge color='green' variant='outline'>
                  Due {dueDate}
                </Badge>
              )}
            </Group>
          </Stack>
        </Paper>
      )}
    </Draggable>
  );
}
