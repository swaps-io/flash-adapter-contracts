// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {OrderReceiverMock, ReceiveOrderMock} from "./OrderReceiverMock.sol";

contract DelegateReceiveResolverMock {
    error ResolverTestError();

    OrderReceiverMock public immutable orderReceiver;

    constructor() {
        orderReceiver = new OrderReceiverMock();
    }

    function receiveDelegateOrderAsset(ReceiveOrderMock calldata order_, uint256 flowFlags_) external {
        require(flowFlags_ & 1 == 0, ResolverTestError()); // shouldRevert

        if (flowFlags_ & 2 == 0) { // ignoreReceive
            orderReceiver.receiveOrderAsset(order_, "");
        }
    }
}
