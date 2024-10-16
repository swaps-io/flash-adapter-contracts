import { Address, bytesToHex, Hex, hexToBytes, numberToBytes } from 'viem';

export const encodeDynamicResolver = (resolverAddress: Address, orderOffset: bigint): Hex => {
  const resolverAddressBytes = hexToBytes(resolverAddress, { size: 20 });
  const orderOffsetBytes = numberToBytes(orderOffset, { size: 12 });
  const dynamicResolverBytes = new Uint8Array(32);
  dynamicResolverBytes.set(orderOffsetBytes);
  dynamicResolverBytes.set(resolverAddressBytes, orderOffsetBytes.byteLength);
  const dynamicResolver = bytesToHex(dynamicResolverBytes);
  return dynamicResolver;
};
