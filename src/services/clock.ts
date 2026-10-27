export interface Clock {
  now(): number;
}
export const systemClock: Clock = { now: () => Date.now() };
export type IdGenerator = () => string;
export const uuid: IdGenerator = () => crypto.randomUUID();
