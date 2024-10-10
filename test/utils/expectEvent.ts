import { Address, EncodeAbiParametersReturnType, EncodeEventTopicsReturnType, Hex } from 'viem';
import { viem } from 'hardhat';
import { expect } from 'chai';

interface EventSpec {
  emitter: Address,
  topics: EncodeEventTopicsReturnType,
  data?: EncodeAbiParametersReturnType,
  index?: number;
}

export const expectEvent = async (hash: Hex, spec: EventSpec): Promise<void> => {
  const publicClient = await viem.getPublicClient();
  const depositReceipt = await publicClient.getTransactionReceipt({ hash });

  const specSignature = spec.topics[0];
  const specIndex = spec.index ?? 0;
  const specData = spec.data ?? '0x';

  let eventFound = false;
  let eventIndex = -1;
  for (const log of depositReceipt.logs) {
    const signature = log.topics[0];
    if (log.address !== spec.emitter || signature !== specSignature) {
      continue;
    }

    eventIndex++;
    if (eventIndex !== specIndex) {
      continue;
    }

    expect(log.topics.length).equal(spec.topics.length);
    for (let i = 0; i < log.topics.length; i++) {
      expect(log.topics[i]).equal(spec.topics[i]);
    }
    expect(log.data).equal(specData);

    eventFound = true;
    break;
  }

  expect(eventFound).equal(true);
};
