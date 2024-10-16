// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {OrderReceiverMock, ReceiveOrderMock} from "./OrderReceiverMock.sol";

import {Order} from "../flash/order/interfaces/Order.sol";

contract DelegateReceiveResolverMock {
    error ResolverTestError();

    OrderReceiverMock public immutable orderReceiver;

    constructor() {
        orderReceiver = new OrderReceiverMock();
    }

    function receiveDelegateOrderAsset(ReceiveOrderMock calldata order_, uint256 flowFlags_) external {
        _processMockOrder(order_, flowFlags_);
    }

    function receiveDynamicOrderOffset4(Order calldata order_, uint256 flowFlags_, bytes32) external {
        // Dynamic receive offset test - order at 4: 4 (selector) + 0
        _processMockOrder(_toMockOrder(order_), flowFlags_);
    }

    function receiveDynamicOrderOffset36(bytes32, Order calldata order_, uint256 flowFlags_, bytes32) external {
        // Dynamic receive offset test - order at 36: 4 (selector) + 32 (bytes32)
        _processMockOrder(_toMockOrder(order_), flowFlags_);
    }

    function receiveDynamicOrderOffset100(bytes32, bytes calldata, uint8, Order calldata order_, uint256 flowFlags_, bytes32) external {
        // Dynamic receive offset test - order at 100: 4 (selector) + 32 (bytes32) + 32 (bytes calldata) + 32 (uint8)
        _processMockOrder(_toMockOrder(order_), flowFlags_);
    }

    function _processMockOrder(ReceiveOrderMock memory order_, uint256 flowFlags_) private {
        require(flowFlags_ & 1 == 0, ResolverTestError()); // shouldRevert

        if (flowFlags_ & 2 == 0) { // ignoreReceive
            orderReceiver.receiveOrderAsset(order_, "");
        }
    }

    function _toMockOrder(Order calldata order_) private pure returns (ReceiveOrderMock memory mockOrder) {
        mockOrder.fromActor = order_.fromActor;
        mockOrder.fromToken = order_.fromToken;
        mockOrder.fromAmount = order_.fromAmount;
        mockOrder.toActor = order_.toActor;
    }
}
