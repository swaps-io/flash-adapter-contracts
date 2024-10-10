import { encodeAbiParameters, encodeEventTopics, encodeFunctionData, maxUint256 } from 'viem';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { viem } from 'hardhat';
import { expect } from 'chai';

import { logGas } from '../../utils/logGas';
import { expectEvent } from '../../utils/expectEvent';

describe('DelegateReceiveAdapter', function () {
  async function deployFixture() {
    const resolver = await viem.deployContract('DelegateReceiveResolverMock');
    const receiver = await viem.getContractAt('OrderReceiverMock', await resolver.read.orderReceiver());
    const adapter = await viem.deployContract('DelegateReceiveAdapter', [receiver.address]);
    const executor = await viem.deployContract('CallExecutor');
    const token = await viem.deployContract('TokenMock');

    return {
      resolver,
      receiver,
      adapter,
      executor,
      token,
    };
  }

  it('Should receive order asset though delegate adapter', async function () {
    const { resolver, receiver, adapter, executor, token } = await loadFixture(deployFixture);

    const executorBalance = 123_456_789_012n;
    await token.write.mint([
      executor.address, // account
      executorBalance, // amount
    ]);

    const order = {
      fromActor: adapter.address,
      fromToken: token.address,
      fromAmount: 444_222n,
      toActor: resolver.address,
    } as const;
    const orderHash = await receiver.read.calcOrderMockHash([order]);

    const resolverData = encodeAbiParameters(
      resolver.abi[3].inputs,
      [{
        order,
        shouldCallReceive: true,
      }],
    );

    const approveCall = {
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
    } as const;
    const receiveCall = {
      target: adapter.address,
      value: 0n,
      callData: encodeFunctionData({
        abi: adapter.abi,
        functionName: 'receiveDelegateAsset',
        args: [
          token.address, // token
          order.fromAmount, // amount
          executorBalance - order.fromAmount, // minBalanceAfter
          orderHash, // orderHash
          resolver.address, // resolver
          resolverData, // resolverData
        ],
      }),
      allowFailure: false,
      isDelegateCall: false,
    } as const;

    {
      const hash = await executor.write.executeCalls([
        [approveCall, receiveCall], // calls
      ]);
      await logGas(hash, 'Receive though delegate adapter with 2 executor calls (approve + receive)');

      await expectEvent(hash, {
        emitter: adapter.address,
        topics: encodeEventTopics({
          abi: adapter.abi,
          eventName: 'DelegateAssetReceive',
          args: {
            orderHash,
          },
        }),
      });
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
