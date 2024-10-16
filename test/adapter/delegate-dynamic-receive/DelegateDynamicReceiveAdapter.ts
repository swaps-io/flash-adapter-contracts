import { encodeEventTopics, encodeFunctionData, Hex, maxUint256, zeroHash } from 'viem';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { viem } from 'hardhat';
import { expect } from 'chai';

import { encodeDynamicResolver } from '../../lib/dynamicResolver';
import { Order } from '../../lib/order';
import { calcOrderHash } from '../../lib/orderHash';

import { logGas } from '../../utils/logGas';
import { expectEvent } from '../../utils/expectEvent';
import { resolverFlowFlags } from '../../utils/resolverFlow';
import { Call } from '../../utils/call';

describe('DelegateDynamicReceiveAdapter', function () {
  async function deployFixture() {
    const resolver = await viem.deployContract('DelegateReceiveResolverMock');
    const receiver = await viem.getContractAt('OrderReceiverMock', await resolver.read.orderReceiver());
    const adapter = await viem.deployContract('DelegateDynamicReceiveAdapter', [receiver.address]);
    const executor = await viem.deployContract('CallExecutor');
    const token = await viem.deployContract('TokenMock');
    const rate = await viem.deployContract('RateLibTest');

    return {
      resolver,
      receiver,
      adapter,
      executor,
      token,
      rate,
    };
  }

  it('Should receive order asset though delegate dynamic adapter', async function () {
    const { resolver, receiver, adapter, executor, token, rate } = await loadFixture(deployFixture);

    const executorBalance = 123_456_789_012n;
    await token.write.mint([
      executor.address, // account
      executorBalance, // amount
    ]);

    const maxExtraFromAmount = 100_000n;
    const dynamicOrder: Order = {
      fromActor: adapter.address, // In-use
      fromActorReceiver: '0x1101101101101101101101101101101101101101',
      fromChain: 12_345n,
      fromToken: token.address, // In-use
      fromAmount: 444_222n, // In-use
      toActor: resolver.address, // In-use
      toChain: 54_321n,
      toToken: '0x3000300030003000300030003000300030003000',
      toAmount: 1_000000000_000000000_000000000_000000000n, // In-use (rate 1.0)
      collateralReceiver: '0x1001111001111010100011001000000000111111',
      collateralChain: 55_555n,
      collateralAmount: 17_823_000n,
      collateralRewardable: 23_000n,
      collateralUnlocked: 172_368_123n,
      deadline: 2_000_000_000n,
      timeToSend: 300n,
      timeToLiqSend: 600n,
      nonce: 1_337_133_713_371_337n,
    };
    const dynamicOrderHash = await receiver.read.calcOrderMockHash([dynamicOrder]);
    const dynamicOrderOffset = 36n;

    const dynamicResolver = encodeDynamicResolver(resolver.address, dynamicOrderOffset);
    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDynamicOrderOffset36',
      args: [
        zeroHash,
        dynamicOrder, // order
        resolverFlowFlags(), // flowFlags
        zeroHash,
      ],
    });

    const approveCall: Call = {
      target: token.address,
      value: 0n,
      callData: encodeFunctionData({
        abi: token.abi,
        functionName: 'approve',
        args: [
          adapter.address, // spender
          maxUint256, // value
        ],
      }),
      allowFailure: true,
      isDelegateCall: false,
    };
    const receiveCall: Call = {
      target: adapter.address,
      value: 0n,
      callData: encodeFunctionData({
        abi: adapter.abi,
        functionName: 'receiveDelegateAsset',
        args: [
          maxExtraFromAmount, // maxExtraFromAmount
          executorBalance - (dynamicOrder.fromAmount + maxExtraFromAmount), // minBalanceAfter
          dynamicOrderHash, // dynOrderHash
          dynamicResolver, // resolver
          resolverData, // resolverData
        ],
      }),
      allowFailure: false,
      isDelegateCall: false,
    };

    const order = { ...dynamicOrder };
    order.fromAmount += maxExtraFromAmount;
    order.toAmount = await rate.read.applyRate([order.fromAmount, dynamicOrder.toAmount]);
    const orderHash = calcOrderHash(order);

    {
      const hash = await executor.write.executeCalls([
        [approveCall, receiveCall], // calls
      ]);
      await logGas(hash, 'Receive though delegate dynamic adapter with 2 executor calls (approve + receive)');

      await expectEvent(hash, {
        emitter: adapter.address,
        topics: encodeEventTopics({
          abi: adapter.abi,
          eventName: 'DelegateDynamicAssetReceive',
          args: {
            dynamicOrderHash,
            orderHash,
          },
        }),
      });
    }

    {
      const hash = await adapter.read.receivedOrderHash([dynamicOrderHash]);
      expect(hash).equal(orderHash);
    }
    {
      const received = await receiver.read.orderAssetReceived([orderHash]);
      expect(received).equal(true);
    }
    {
      const balance = await token.read.balanceOf([resolver.address]);
      expect(balance).equal(order.fromAmount);
    }
    {
      const balance = await token.read.balanceOf([adapter.address]);
      expect(balance).equal(0n);
    }
    {
      const balance = await token.read.balanceOf([executor.address]);
      expect(balance).equal(executorBalance - order.fromAmount);
    }
  });
});
