import { Hex } from 'viem';

export interface ReceiveOrderMock {
  fromActor: Hex;
  fromToken: Hex;
  fromAmount: bigint;
  toActor: Hex;
}
