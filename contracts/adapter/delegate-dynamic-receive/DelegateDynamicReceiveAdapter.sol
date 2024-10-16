// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {SafeERC20, IERC20, Address} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IDelegateDynamicReceiveAdapter, IOrderReceiver} from "./interfaces/IDelegateDynamicReceiveAdapter.sol";

import {OrderHashLib, Order} from "../../flash/order/OrderHashLib.sol";

import {RateLib} from "../../rate/RateLib.sol";

contract DelegateDynamicReceiveAdapter is IDelegateDynamicReceiveAdapter {
    IOrderReceiver public immutable orderReceiver;

    mapping(bytes32 dynOrderHash => bytes32) public receivedOrderHash;

    constructor(IOrderReceiver orderReceiver_) {
        orderReceiver = orderReceiver_;
    }

    function receiveDelegateAsset(IERC20 token_, uint256 minAmount_, uint256 maxAmount_, uint256 minBalanceAfter_, uint256 toAmountRate_, bytes32 dynOrderHash_, bytes32 resolver_, bytes memory resolverData_) external {
        require(minAmount_ > 0 && minAmount_ <= maxAmount_, InvalidAmountRange(minAmount_, maxAmount_));
        require(receivedOrderHash[dynOrderHash_] == 0, DynOrderAlreadyReceived(dynOrderHash_));

        uint256 balance = token_.balanceOf(msg.sender);
        uint256 minBalance = minBalanceAfter_ + minAmount_;
        require(balance >= minBalance, InsufficientBalance(balance, minBalance));

        uint256 amount = balance - minBalanceAfter_;
        if (amount > maxAmount_) {
            amount = maxAmount_;
        }

        Order memory order = _resolverOrder(resolver_, resolverData_);
        order.fromAmount = amount;
        order.toAmount = RateLib.applyRate(amount, toAmountRate_);

        bytes32 orderHash = OrderHashLib.calcOrderHash(order);
        require(!orderReceiver.orderAssetReceived(orderHash), OrderAlreadyReceived(orderHash));
        receivedOrderHash[dynOrderHash_] = orderHash;

        SafeERC20.safeTransferFrom(token_, msg.sender, address(this), amount);
        if (token_.allowance(address(this), address(orderReceiver)) < amount) {
            SafeERC20.forceApprove(token_, address(orderReceiver), type(uint256).max);
        }

        Address.functionCall(_resolverAddress(resolver_), resolverData_);

        require(orderReceiver.orderAssetReceived(orderHash), OrderNotReceived(orderHash));
        emit DelegateDynamicAssetReceive(dynOrderHash_, orderHash);
    }

    function isValidSignature(bytes32, bytes memory) external pure returns (bytes4) {
        return this.isValidSignature.selector;
    }

    function _resolverOrder(bytes32 resolver_, bytes memory resolverData_) internal pure returns (Order memory order) {
        uint256 orderOffset = _resolverOrderOffset(resolver_);
        assembly { order := add(resolverData_, orderOffset) }
    }

    function _resolverOrderOffset(bytes32 resolver_) internal pure returns (uint256) {
        return uint256(resolver_) >> 160;
    }

    function _resolverAddress(bytes32 resolver_) internal pure returns (address) {
        return address(uint160(uint256(resolver_)));
    }
}
