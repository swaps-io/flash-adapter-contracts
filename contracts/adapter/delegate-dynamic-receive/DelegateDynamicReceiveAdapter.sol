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

    function receiveDelegateAsset(uint256 maxExtraFromAmount_, uint256 minBalanceAfter_, bytes32 dynamicOrderHash_, bytes32 resolver_, bytes memory resolverData_) external {
        require(receivedOrderHash[dynamicOrderHash_] == 0, DynamicOrderAlreadyReceived(dynamicOrderHash_));

        Order memory order = _resolverOrder(resolver_, resolverData_);
        IERC20 fromToken = IERC20(order.fromToken);
        uint256 fromAmount = order.fromAmount;

        uint256 balance = fromToken.balanceOf(msg.sender);
        uint256 minBalance = fromAmount + minBalanceAfter_;
        require(balance >= minBalance, InsufficientBalance(balance, minBalance));

        uint256 extraFromAmount = balance - minBalance;
        if (extraFromAmount > maxExtraFromAmount_) {
            extraFromAmount = maxExtraFromAmount_;
        }
        fromAmount += extraFromAmount;

        order.fromAmount = fromAmount;
        order.toAmount = RateLib.applyRate(fromAmount, order.toAmount); // toAmountRate

        bytes32 orderHash = OrderHashLib.calcOrderHash(order);
        require(!orderReceiver.orderAssetReceived(orderHash), OrderAlreadyReceived(orderHash));
        receivedOrderHash[dynamicOrderHash_] = orderHash;

        SafeERC20.safeTransferFrom(fromToken, msg.sender, address(this), fromAmount);
        if (fromToken.allowance(address(this), address(orderReceiver)) < fromAmount) {
            SafeERC20.forceApprove(fromToken, address(orderReceiver), type(uint256).max);
        }

        Address.functionCall(_resolverAddress(resolver_), resolverData_);

        require(orderReceiver.orderAssetReceived(orderHash), OrderNotReceived(orderHash));
        emit DelegateDynamicAssetReceive(dynamicOrderHash_, orderHash);
    }

    function isValidSignature(bytes32, bytes memory) external pure returns (bytes4) {
        return this.isValidSignature.selector;
    }

    function _resolverOrder(bytes32 resolver_, bytes memory resolverData_) internal pure returns (Order memory order) {
        uint256 orderOffset = _resolverOrderOffset(resolver_);
        assembly { order := add(add(resolverData_, 32), orderOffset) }
    }

    function _resolverOrderOffset(bytes32 resolver_) internal pure returns (uint256) {
        return uint256(resolver_) >> 160;
    }

    function _resolverAddress(bytes32 resolver_) internal pure returns (address) {
        return address(uint160(uint256(resolver_)));
    }
}
