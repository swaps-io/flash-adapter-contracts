// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {IDelegateReceiveResolver} from "../adapter/delegate-receive/interfaces/IDelegateReceiveResolver.sol";

import {OrderReceiverMock, ReceiveOrderMock} from "./OrderReceiverMock.sol";

struct ResolverDataMock {
    ReceiveOrderMock order;
    bool shouldCallReceive;
}

contract DelegateReceiveResolverMock is IDelegateReceiveResolver {
    OrderReceiverMock public immutable orderReceiver;

    constructor() {
        orderReceiver = new OrderReceiverMock();
    }

    function receiveDelegateOrderAsset(bytes calldata resolverData_) external {
        ResolverDataMock calldata dataMock;
        assembly { dataMock := resolverData_.offset }

        if (dataMock.shouldCallReceive) {
            orderReceiver.receiveOrderAsset(dataMock.order, "");
        }
    }

    function resolverDataMock(ResolverDataMock calldata) external pure {
        // In-use for type-safe ResolverDataMock struct data encoding (ABI index: 3)
    }
}
