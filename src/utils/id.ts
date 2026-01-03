export const idToTeamId = (id: string | number) => {
  const normalizedId = typeof id === 'number' ? id.toString() : id;
  return `INC-T-${normalizedId.padStart(3, '0')}`;
};

export const idToPid = (id: string | number) => {
  const normalizedId = typeof id === 'number' ? id.toString() : id;
  return `INC-P-${normalizedId.padStart(3, '0')}`;
};

export const ID = {
    toTeamId: idToTeamId,
    toPid: idToPid
}
