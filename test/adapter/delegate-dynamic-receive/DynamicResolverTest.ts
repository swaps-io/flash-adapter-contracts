import { concatHex, encodeFunctionData, zeroAddress, zeroHash } from 'viem';
import { loadFixture } from '@nomicfoundation/hardhat-toolbox-viem/network-helpers';
import { viem } from 'hardhat';
import { expect } from 'chai';

import { encodeDynamicResolver } from '../../lib/dynamicResolver';
import { Order } from '../../lib/order';

import { resolverFlowFlags } from '../../utils/resolverFlow';

describe('DynamicResolverTest', function () {
  async function deployFixture() {
    const resolver = await viem.deployContract('DelegateReceiveResolverMock');
    const test = await viem.deployContract('DynamicResolverTest');

    return {
      resolver,
      test,
    };
  }

  it('Should encode dynamic resolver', async function () {
    const orderOffset = 1_234_567_890n; // 31 out of 96 bits
    const resolverAddress = '0xDeadc0dedeAdc0DEDeaDc0deDeADc0DedEadc0De';
    const dynamicResolver = encodeDynamicResolver(resolverAddress, orderOffset);
    expect(dynamicResolver).equal('0x0000000000000000499602d2deadc0dedeadc0dedeadc0dedeadc0dedeadc0de');
  });

  it('Should encode zero dynamic resolver', async function () {
    const orderOffset = 0n;
    const resolverAddress = zeroAddress;
    const dynamicResolver = encodeDynamicResolver(resolverAddress, orderOffset);
    expect(dynamicResolver).equal(zeroHash);
  });

  it('Should decode address from dynamic resolver', async function () {
    const { test } = await loadFixture(deployFixture);

    const orderOffset = 1_234_567_890n; // 31 out of 96 bits
    const resolverAddress = '0xDeadc0dedeAdc0DEDeaDc0deDeADc0DedEadc0De';
    const dynamicResolver = encodeDynamicResolver(resolverAddress, orderOffset);

    const address = await test.read.resolverAddress([dynamicResolver]);
    expect(address).equal(resolverAddress);
  });

  it('Should decode zero address from dynamic resolver', async function () {
    const { test } = await loadFixture(deployFixture);

    const orderOffset = 0n;
    const resolverAddress = zeroAddress;
    const dynamicResolver = encodeDynamicResolver(resolverAddress, orderOffset);

    const address = await test.read.resolverAddress([dynamicResolver]);
    expect(address).equal(resolverAddress);
  });

  it('Should decode order offset from dynamic resolver', async function () {
    const { test } = await loadFixture(deployFixture);

    const orderOffset = 1_234_567_890n; // 31 out of 96 bits
    const resolverAddress = '0xDeadc0dedeAdc0DEDeaDc0deDeADc0DedEadc0De';
    const dynamicResolver = encodeDynamicResolver(resolverAddress, orderOffset);

    const offset = await test.read.resolverOrderOffset([dynamicResolver]);
    expect(offset).equal(orderOffset);
  });

  it('Should decode zero order offset from dynamic resolver', async function () {
    const { test } = await loadFixture(deployFixture);

    const orderOffset = 0n;
    const resolverAddress = '0xDeadc0dedeAdc0DEDeaDc0deDeADc0DedEadc0De';
    const dynamicResolver = encodeDynamicResolver(resolverAddress, orderOffset);

    const offset = await test.read.resolverOrderOffset([dynamicResolver]);
    expect(offset).equal(orderOffset);
  });

  it('Should decode order from dynamic resolver data at offset 4', async function () {
    const { test, resolver } = await loadFixture(deployFixture);

    const order: Order = {
      fromActor: '0x0101010101010101010101010101010101010101',
      fromActorReceiver: '0x1101101101101101101101101101101101101101',
      fromChain: 12_345n,
      fromToken: '0x2020202020202020202020202020202020202020',
      fromAmount: 444_222_111n,
      toActor: '0x0333000333000333000333000333000333000333',
      toChain: 54_321n,
      toToken: '0x3000300030003000300030003000300030003000',
      toAmount: 678_981_155n,
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
    const orderOffset = 4n;

    const dynamicResolver = encodeDynamicResolver(resolver.address, orderOffset);
    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDynamicOrderOffset4',
      args: [
        order,
        resolverFlowFlags(),
        zeroHash,
      ],
    });

    const resolverOrder = await test.read.resolverOrder([dynamicResolver, resolverData]);
    const keys = Object.keys(order) as (keyof typeof order)[];
    for (const key of keys) {
      expect(resolverOrder[key]).equal(order[key]);
    }
  });

  it('Should decode order from dynamic resolver data at offset 36', async function () {
    const { test, resolver } = await loadFixture(deployFixture);

    const order: Order = {
      fromActor: '0x0101010101010101010101010101010101010101',
      fromActorReceiver: '0x1101101101101101101101101101101101101101',
      fromChain: 12_345n,
      fromToken: '0x2020202020202020202020202020202020202020',
      fromAmount: 444_222_111n,
      toActor: '0x0333000333000333000333000333000333000333',
      toChain: 54_321n,
      toToken: '0x3000300030003000300030003000300030003000',
      toAmount: 678_981_155n,
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
    const orderOffset = 36n;

    const dynamicResolver = encodeDynamicResolver(resolver.address, orderOffset);
    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDynamicOrderOffset36',
      args: [
        zeroHash,
        order,
        resolverFlowFlags(),
        zeroHash,
      ],
    });

    const resolverOrder = await test.read.resolverOrder([dynamicResolver, resolverData]);
    const keys = Object.keys(order) as (keyof typeof order)[];
    for (const key of keys) {
      expect(resolverOrder[key]).equal(order[key]);
    }
  });

  it('Should decode order from dynamic resolver data at offset 100', async function () {
    const { test, resolver } = await loadFixture(deployFixture);

    const order: Order = {
      fromActor: '0x0101010101010101010101010101010101010101',
      fromActorReceiver: '0x1101101101101101101101101101101101101101',
      fromChain: 12_345n,
      fromToken: '0x2020202020202020202020202020202020202020',
      fromAmount: 444_222_111n,
      toActor: '0x0333000333000333000333000333000333000333',
      toChain: 54_321n,
      toToken: '0x3000300030003000300030003000300030003000',
      toAmount: 678_981_155n,
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
    const orderOffset = 100n;

    const dynamicResolver = encodeDynamicResolver(resolver.address, orderOffset);
    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDynamicOrderOffset100',
      args: [
        zeroHash,
        concatHex([zeroHash, '0x1234', zeroHash, '0x6987236431']),
        0,
        order,
        resolverFlowFlags(),
        zeroHash,
      ],
    });

    const resolverOrder = await test.read.resolverOrder([dynamicResolver, resolverData]);
    const keys = Object.keys(order) as (keyof Order)[];
    for (const key of keys) {
      expect(resolverOrder[key]).equal(order[key]);
    }
  });

  it('Should calc resolver order hash', async function () {
    const { test, resolver } = await loadFixture(deployFixture);

    const order: Order = {
      fromActor: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      fromActorReceiver: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      fromChain: 512n,
      fromToken: '0x0101010101010101010101010101010101010101',
      fromAmount: 1234n,
      toActor: '0xdeadc0dedeadc0dedeadc0dedeadc0dedeadc0de',
      toChain: 1024n,
      toToken: '0x0202020202020202020202020202020202020202',
      toAmount: 3456n,
      collateralReceiver: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      collateralChain: 69n,
      collateralAmount: 1234n,
      collateralRewardable: 322n,
      collateralUnlocked: 6996n,
      deadline: 12345678901234567890n,
      timeToSend: 112233n,
      timeToLiqSend: 330101033n,
      nonce: 421337n,
    };
    const orderOffset = 36n;

    const dynamicResolver = encodeDynamicResolver(resolver.address, orderOffset);
    const resolverData = encodeFunctionData({
      abi: resolver.abi,
      functionName: 'receiveDynamicOrderOffset36',
      args: [
        zeroHash,
        order,
        resolverFlowFlags(),
        zeroHash,
      ],
    });

    const orderHash = await test.read.calcResolverOrderHash([dynamicResolver, resolverData]);
    expect(orderHash).to.be.equal('0x044807f64a380eac8ee1fff9faca0f89c7015d9461afdd6fd567acc5016d4b7c');
  });
});
