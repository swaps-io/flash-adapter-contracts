import { Hex } from 'viem';

export interface Call {
  target: Hex;
  value: bigint;
  callData: Hex;
  allowFailure: boolean;
  isDelegateCall: boolean;
}
