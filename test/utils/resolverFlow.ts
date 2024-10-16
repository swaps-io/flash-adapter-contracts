export interface ResolverFlowFlagParams {
  shouldRevert?: boolean;
  ignoreReceive?: boolean;
}

export const resolverFlowFlags = (params: ResolverFlowFlagParams = {}): bigint => {
  let flags = 0n;
  if (params.shouldRevert) {
    flags |= 1n;
  }
  if (params.ignoreReceive) {
    flags |= 2n;
  }
  return flags;
}
