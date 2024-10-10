import hre from 'hardhat';
import { Hex } from 'viem';
import { print } from 'hardhat-tracer';

const GAS_TRACE_ENABLED = false;

type Trace = NonNullable<ReturnType<typeof hre.tracer.lastTrace>>;

export const logGas = async (hash: Hex, info: string): Promise<void> => {
  const gas = await getGasUsed(hash);
  logGasUsed(gas, info);

  if (GAS_TRACE_ENABLED) {
    const trace = await getTrace(hash);
    await logTrace(trace, info);
    logGasUsed(gas, info);
  }
};

const getGasUsed = async (hash: Hex): Promise<bigint> => {
  const publicClient = await hre.viem.getPublicClient();
  const depositReceipt = await publicClient.getTransactionReceipt({ hash });
  return depositReceipt.gasUsed;
};

const logGasUsed = (gas: bigint, info: string): void => {
  console.log(`      ⇣ ${info}: ${gas} (${gas - 21_000n}) ⛽️`);
};

const getTrace = async (hash: Hex): Promise<Trace> => {
  // Cannot use task from current 'hardhat-trace' version since it's broken for local Hardhat provider.
  // The author fixed it in the repo, but haven't released this version to NPM.
  // So porting only needed part of the task with the fix here.

  const hts = hre.tracer.switch;
  if (hts === undefined) {
    throw new Error('Tracer switch is missing in HRE');
  }

  await hts.enable();
  await hre.network.provider.send("debug_traceTransaction", [hash]);
  await hts.disable();

  const trace = hre.tracer.lastTrace();
  if (trace === undefined) {
    throw new Error(`Failed to get trace of transaction ${hash}`);
  }

  return trace;
};

const logTrace = async (trace: Trace, info: string): Promise<void> => {
  console.log(`      ⇣ ${info}: trace ⇣ 🔎`);
  await print(trace, {
    artifacts: hre.artifacts,
    tracerEnv: hre.tracer,
    provider: hre.network.provider,
  });
  console.log(`      ⇣ ${info}: trace ⇡ 🔎`);
};
