import { Hex } from 'viem';

export interface Order {
  fromActor: Hex;
  fromActorReceiver: Hex;
  fromChain: bigint;
  fromToken: Hex;
  fromAmount: bigint;
  toActor: Hex;
  toChain: bigint;
  toToken: Hex;
  toAmount: bigint;
  collateralReceiver: Hex;
  collateralChain: bigint;
  collateralAmount: bigint;
  collateralRewardable: bigint;
  collateralUnlocked: bigint;
  deadline: bigint;
  timeToSend: bigint;
  timeToLiqSend: bigint;
  nonce: bigint;
}
