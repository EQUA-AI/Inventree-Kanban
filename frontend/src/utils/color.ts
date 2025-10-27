const DEFAULT_PALETTE = [
  '#4c6ef5',
  '#228be6',
  '#15aabf',
  '#12b886',
  '#40c057',
  '#fab005',
  '#fd7e14',
  '#fa5252',
  '#e64980',
  '#845ef7'
];

function hashString(input: string) {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0; // eslint-disable-line no-bitwise
  }

  return Math.abs(hash);
}

export function resolveUserColor(
  assignee?: string,
  explicitMap?: Record<string, string>,
  palette?: string[]
) {
  if (!assignee) {
    return undefined;
  }

  const normalized = assignee.trim().toLowerCase();
  const explicit = explicitMap?.[normalized];

  if (explicit) {
    return explicit;
  }

  const colors = palette && palette.length > 0 ? palette : DEFAULT_PALETTE;
  const index = hashString(normalized) % colors.length;
  return colors[index];
}

function luminance(value: number) {
  const channel = value / 255;
  return channel <= 0.03928
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

export function idealTextColor(background?: string) {
  if (!background) {
    return undefined;
  }

  const hex = background.replace('#', '');

  if (hex.length !== 6) {
    return undefined;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const l =
    0.2126 * luminance(r) + 0.7152 * luminance(g) + 0.0722 * luminance(b);
  return l > 0.5 ? '#1f2933' : '#ffffff';
}
