export const reconcileSelectedPayerIds = (
  selectedPayerIds: number[],
  pendingPayerIds: Set<number>,
  requiredPayerIds: Set<number>,
) => {
  const required = [...requiredPayerIds].filter((playerId) => pendingPayerIds.has(playerId));
  const next = [
    ...required,
    ...selectedPayerIds.filter((playerId) => pendingPayerIds.has(playerId) && !requiredPayerIds.has(playerId)),
  ];

  return next.length === selectedPayerIds.length
    && next.every((playerId, index) => playerId === selectedPayerIds[index])
    ? selectedPayerIds
    : next;
};
