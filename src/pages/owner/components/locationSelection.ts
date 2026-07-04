type ReverseAddress = (lat: number, lng: number) => Promise<string>;

type LocationValue = {
  address: string;
  latitude: string;
  longitude: string;
};

type SelectionOutcome =
  | { status: 'success'; value: LocationValue }
  | { status: 'failure'; value: LocationValue }
  | { status: 'stale' };

const valueFor = (lat: number, lng: number, address: string): LocationValue => ({
  address,
  latitude: lat.toFixed(7),
  longitude: lng.toFixed(7),
});

export const createLocationSelectionController = (reverse: ReverseAddress) => {
  let latestRequestId = 0;
  return {
    async select(lat: number, lng: number, knownAddress?: string): Promise<SelectionOutcome> {
      const requestId = ++latestRequestId;
      try {
        const address = knownAddress ?? await reverse(lat, lng);
        if (requestId !== latestRequestId) return { status: 'stale' };
        return { status: 'success', value: valueFor(lat, lng, address) };
      } catch {
        if (requestId !== latestRequestId) return { status: 'stale' };
        return { status: 'failure', value: valueFor(lat, lng, '') };
      }
    },
  };
};
