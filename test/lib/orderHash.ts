import { hashTypedData, Hex, TypedDataDefinition, TypedDataDomain } from 'viem';
import { Order } from './order';

const FLASH_DOMAIN: TypedDataDomain = {
  name: 'swaps-io/Flash',
  version: '1',
};

const ORDER_TYPE = {
  Order: [
    { type: 'address', name: 'fromActor' },
    { type: 'address', name: 'fromActorReceiver' },
    { type: 'uint256', name: 'fromChain' },
    { type: 'address', name: 'fromToken' },
    { type: 'uint256', name: 'fromAmount' },
    { type: 'address', name: 'toActor' },
    { type: 'uint256', name: 'toChain' },
    { type: 'address', name: 'toToken' },
    { type: 'uint256', name: 'toAmount' },
    { type: 'address', name: 'collateralReceiver' },
    { type: 'uint256', name: 'collateralChain' },
    { type: 'uint256', name: 'collateralAmount' },
    { type: 'uint256', name: 'collateralRewardable' },
    { type: 'uint256', name: 'collateralUnlocked' },
    { type: 'uint256', name: 'deadline' },
    { type: 'uint256', name: 'timeToSend' },
    { type: 'uint256', name: 'timeToLiqSend' },
    { type: 'uint256', name: 'nonce' },
  ],
} as const;

export const calcOrderHash = (order: Order): Hex => {
  const orderHash = hashTypedData({
    domain: FLASH_DOMAIN,
    types: ORDER_TYPE,
    primaryType: 'Order',
    message: order,
  });
  return orderHash;
};
