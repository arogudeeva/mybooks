import { createContext, useContext, type ReactNode } from 'react';
import type { Container } from './container';

const ContainerContext = createContext<Container | null>(null);

export function ContainerProvider({
  container,
  children,
}: {
  container: Container;
  children: ReactNode;
}) {
  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>;
}

export function useContainer(): Container {
  const c = useContext(ContainerContext);
  if (!c) throw new Error('ContainerProvider не найден');
  return c;
}
