// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {DelegateDynamicReceiveAdapter, IOrderReceiver, Order} from "../adapter/delegate-dynamic-receive/DelegateDynamicReceiveAdapter.sol";

contract DynamicResolverTest is DelegateDynamicReceiveAdapter {
    constructor()
        DelegateDynamicReceiveAdapter(IOrderReceiver(address(0)))
    {}

    function resolverOrder(bytes32 resolver_, bytes memory resolverData_) external pure returns (Order memory order) {
        return _resolverOrder(resolver_, resolverData_);
    }

    function resolverOrderOffset(bytes32 resolver_) external pure returns (uint256) {
        return _resolverOrderOffset(resolver_);
    }

    function resolverAddress(bytes32 resolver_) external pure returns (address) {
        return _resolverAddress(resolver_);
    }
}
