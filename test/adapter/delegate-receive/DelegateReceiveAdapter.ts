import { checksumAddress, encodeEventTopics, encodeFunctionData, maxUint256 } from 'viem';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { viem } from 'hardhat';
import { expect } from 'chai';

import { logGas } from '../../utils/logGas';
import { expectEvent } from '../../utils/expectEvent';
import { resolverFlowFlags } from '../../utils/resolverFlow';
import { ReceiveOrderMock } from '../../utils/order';

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

    const order: ReceiveOrderMock = {
      fromActor: adapter.address,
      fromToken: token.address,
      fromAmount: 444_222n,
      toActor: resolver.address,
    };
    const orderHash = await receiver.read.calcOrderMockHash([order]);

    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDelegateOrderAsset',
      args: [
        order, // order
        resolverFlowFlags(), // flowFlags
      ],
    });

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
    };
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
    };

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

  it('Should receive order asset without approve call if adapter allowance is sufficient', async function () {
    const { resolver, receiver, adapter, executor, token } = await loadFixture(deployFixture);

    const executorBalance = 123_456_789_012n;
    await token.write.mint([
      executor.address, // account
      executorBalance, // amount
    ]);

    const order: ReceiveOrderMock = {
      fromActor: adapter.address,
      fromToken: token.address,
      fromAmount: 444_222n,
      toActor: resolver.address,
    };
    const orderHash = await receiver.read.calcOrderMockHash([order]);

    const approveCall = {
      target: token.address,
      value: 0n,
      callData: encodeFunctionData({
        abi: token.abi,
        functionName: 'approve',
        args: [
          adapter.address, // spender
          order.fromAmount, // value (barely sufficient)
        ],
      }),
      allowFailure: true,
      isDelegateCall: false,
    };

    await executor.write.executeCalls([
      [approveCall], // calls
    ]);

    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDelegateOrderAsset',
      args: [
        order, // order
        resolverFlowFlags(), // flowFlags
      ],
    });

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
    };

    {
      const hash = await executor.write.executeCalls([
        [receiveCall], // calls (uses all available allowance)
      ]);
      await logGas(hash, 'Receive though delegate adapter with 1 executor call (receive)');

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

  it('Should revert if adapter allowance is insufficient', async function () {
    const { resolver, receiver, adapter, executor, token } = await loadFixture(deployFixture);

    const executorBalance = 123_456_789_012n;
    await token.write.mint([
      executor.address, // account
      executorBalance, // amount
    ]);

    const order: ReceiveOrderMock = {
      fromActor: adapter.address,
      fromToken: token.address,
      fromAmount: 444_222n,
      toActor: resolver.address,
    };
    const orderHash = await receiver.read.calcOrderMockHash([order]);

    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDelegateOrderAsset',
      args: [
        order, // order
        resolverFlowFlags(), // flowFlags
      ],
    });

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
    };

    await expect(
      executor.write.executeCalls([
        [receiveCall], // calls (no approve call)
      ])
    ).rejectedWith(
      `custom error 'ERC20InsufficientAllowance("${checksumAddress(adapter.address)}", 0, ${order.fromAmount})'`,
    );
  });

  it('Should revert if caller balance is insufficient', async function () {
    const { resolver, receiver, adapter, executor, token } = await loadFixture(deployFixture);

    const executorBalance = 123_456_789_012n;
    await token.write.mint([
      executor.address, // account
      executorBalance, // amount
    ]);

    const order: ReceiveOrderMock = {
      fromActor: adapter.address,
      fromToken: token.address,
      fromAmount: executorBalance + 1n, // Exceeds balance
      toActor: resolver.address,
    };
    const orderHash = await receiver.read.calcOrderMockHash([order]);

    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDelegateOrderAsset',
      args: [
        order, // order
        resolverFlowFlags(), // flowFlags
      ],
    });

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
    };
    const receiveCall = {
      target: adapter.address,
      value: 0n,
      callData: encodeFunctionData({
        abi: adapter.abi,
        functionName: 'receiveDelegateAsset',
        args: [
          token.address, // token
          order.fromAmount, // amount
          0n, // minBalanceAfter
          orderHash, // orderHash
          resolver.address, // resolver
          resolverData, // resolverData
        ],
      }),
      allowFailure: false,
      isDelegateCall: false,
    };

    await expect(
      executor.write.executeCalls([
        [approveCall, receiveCall], // calls
      ]),
    ).rejectedWith(
      `custom error 'ERC20InsufficientBalance("${checksumAddress(executor.address)}", ${executorBalance}, ${order.fromAmount})'`,
    );
  });

  it('Should revert if caller balance after is insufficient', async function () {
    const { resolver, receiver, adapter, executor, token } = await loadFixture(deployFixture);

    const executorBalance = 123_456_789_012n;
    await token.write.mint([
      executor.address, // account
      executorBalance, // amount
    ]);

    const order: ReceiveOrderMock = {
      fromActor: adapter.address,
      fromToken: token.address,
      fromAmount: 444_222n,
      toActor: resolver.address,
    };
    const orderHash = await receiver.read.calcOrderMockHash([order]);

    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDelegateOrderAsset',
      args: [
        order, // order
        resolverFlowFlags(), // flowFlags
      ],
    });

    const balanceAfter = executorBalance - order.fromAmount;
    const minBalanceAfter = balanceAfter + 1n; // (Will be barely exceeded)

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
    };
    const receiveCall = {
      target: adapter.address,
      value: 0n,
      callData: encodeFunctionData({
        abi: adapter.abi,
        functionName: 'receiveDelegateAsset',
        args: [
          token.address, // token
          order.fromAmount, // amount
          minBalanceAfter, // minBalanceAfter
          orderHash, // orderHash
          resolver.address, // resolver
          resolverData, // resolverData
        ],
      }),
      allowFailure: false,
      isDelegateCall: false,
    };

    await expect(
      executor.write.executeCalls([
        [approveCall, receiveCall], // calls
      ]),
    ).rejectedWith(
      `custom error 'InsufficientBalanceAfter(${executorBalance - order.fromAmount}, ${minBalanceAfter})'`,
    );
  });

  it('Should revert if order already received before', async function () {
    const { resolver, receiver, adapter, executor, token } = await loadFixture(deployFixture);

    const executorBalance = 123_456_789_012n;
    await token.write.mint([
      executor.address, // account
      executorBalance, // amount
    ]);

    const order: ReceiveOrderMock = {
      fromActor: adapter.address,
      fromToken: token.address,
      fromAmount: 444_222n,
      toActor: resolver.address,
    };
    const orderHash = await receiver.read.calcOrderMockHash([order]);

    // Mark as already received
    await receiver.write.setOrderAssetReceived([orderHash, true]);

    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDelegateOrderAsset',
      args: [
        order, // order
        resolverFlowFlags(), // flowFlags
      ],
    });

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
    };
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
    };

    await expect(
      executor.write.executeCalls([
        [approveCall, receiveCall], // calls
      ]),
    ).rejectedWith(
      `custom error 'OrderAlreadyReceived("${orderHash}")'`,
    );
  });

  it('Should revert if order not received after', async function () {
    const { resolver, receiver, adapter, executor, token } = await loadFixture(deployFixture);

    const executorBalance = 123_456_789_012n;
    await token.write.mint([
      executor.address, // account
      executorBalance, // amount
    ]);

    const order: ReceiveOrderMock = {
      fromActor: adapter.address,
      fromToken: token.address,
      fromAmount: 444_222n,
      toActor: resolver.address,
    };
    const orderHash = await receiver.read.calcOrderMockHash([order]);

    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDelegateOrderAsset',
      args: [
        order, // order
        resolverFlowFlags({ ignoreReceive: true }), // flowFlags (simulate not calling receive)
      ],
    });

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
    };
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
    };

    await expect(
      executor.write.executeCalls([
        [approveCall, receiveCall], // calls
      ]),
    ).rejectedWith(
      `custom error 'OrderNotReceived("${orderHash}")'`,
    );
  });

  it('Should revert with resolver error bubble up', async function () {
    const { resolver, receiver, adapter, executor, token } = await loadFixture(deployFixture);

    const executorBalance = 123_456_789_012n;
    await token.write.mint([
      executor.address, // account
      executorBalance, // amount
    ]);

    const order: ReceiveOrderMock = {
      fromActor: adapter.address,
      fromToken: token.address,
      fromAmount: 444_222n,
      toActor: resolver.address,
    };
    const orderHash = await receiver.read.calcOrderMockHash([order]);

    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDelegateOrderAsset',
      args: [
        order, // order
        resolverFlowFlags({ shouldRevert: true }), // flowFlags (simulate resolver revert)
      ],
    });

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
    };
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
    };

    await expect(
      executor.write.executeCalls([
        [approveCall, receiveCall], // calls
      ]),
    ).rejectedWith(
      `custom error 'ResolverTestError()'`,
    );
  });
});
