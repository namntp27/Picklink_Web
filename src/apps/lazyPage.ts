import React, { type ComponentType } from 'react';

export const lazyPage = <TModule extends Record<string, unknown>>(
  loader: () => Promise<TModule>,
  exportName: keyof TModule,
) => React.lazy(async () => {
  const module = await loader();
  return { default: module[exportName] as ComponentType<any> };
});
