const headerColorByGroupId: {[groupId: string]: string} = {
  'alerts': '#D83B01',
};

const DEFAULT_HEADER_COLOR = '#0078D4';

export const getHeaderColorByGroupId = (groupId: string) => {
  return headerColorByGroupId[groupId] ?? DEFAULT_HEADER_COLOR;
};