import { ZapPath } from './path';
import { ZapStep } from './step';

export type ZapRouteResponse = {
  steps: ZapStep[];
  path: ZapPath[];
};

export * from './path';
export * from './step';
