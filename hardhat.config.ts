import type { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox-viem';
import 'hardhat-contract-sizer';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.27',
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 1_000_000,
        details: {
          yulDetails: {
            optimizerSteps: 'u',
          },
        },
      },
    },
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: true,
    runOnCompile: true,
    strict: true,
    only: [
      'contracts/adapter/delegate-receive/DelegateReceiveAdapter.sol',
      'contracts/adapter/delegate-dynamic-receive/DelegateDynamicReceiveAdapter.sol',
    ],
  },
};

export default config;
