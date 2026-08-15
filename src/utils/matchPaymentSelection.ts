export const reconcileSelectedPayerIds = (
  selectedPayerIds: number[],
  pendingPayerIds: Set<number>,
  currentPlayerId?: number | null,
) => {
  const retained = selectedPayerIds.filter((playerId) => pendingPayerIds.has(playerId));
  const next = currentPlayerId && pendingPayerIds.has(currentPlayerId)
    ? [currentPlayerId, ...retained.filter((playerId) => playerId !== currentPlayerId)]
    : retained;

  return next.length === selectedPayerIds.length
    && next.every((playerId, index) => playerId === selectedPayerIds[index])
    ? selectedPayerIds
    : next;
};
