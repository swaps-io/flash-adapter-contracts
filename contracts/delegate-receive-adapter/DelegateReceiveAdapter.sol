// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {OrderHashLib} from "../flash/order/OrderHashLib.sol";

import {IDelegateReceiveAdapter, IOrderReceiver, Order} from "./interfaces/IDelegateReceiveAdapter.sol";
import {IDelegateReceiveResolver} from "./interfaces/IDelegateReceiveResolver.sol";

contract DelegateReceiveAdapter is IDelegateReceiveAdapter {
    IOrderReceiver public immutable orderReceiver;

    constructor(IOrderReceiver orderReceiver_) {
        orderReceiver = orderReceiver_;
    }

    function receiveDelegateOrderAsset(Order calldata order_, bytes calldata orderMetadata_, uint256 minBalanceAfter_) external {
        require(order_.fromActor == address(this), FromActorMismatch(order_.fromActor, address(this)));
        bytes32 orderHash = OrderHashLib.calcOrderHash(order_);
        require(!orderReceiver.orderAssetReceived(orderHash), OrderAlreadyReceived(orderHash));

        _delegateTokenToOrderReceiver(IERC20(order_.fromToken), order_.fromAmount, minBalanceAfter_);
        IDelegateReceiveResolver(order_.toActor).receiveDelegateOrderAsset(order_, orderMetadata_);

        require(orderReceiver.orderAssetReceived(orderHash), OrderNotReceived(orderHash));
        emit AssetDelegateReceive(orderHash);
    }

    function isValidSignature(bytes32, bytes memory) external pure returns (bytes4) {
        return this.isValidSignature.selector;
    }

    function _delegateTokenToOrderReceiver(IERC20 token_, uint256 amount_, uint256 minBalanceAfter_) private {
        SafeERC20.safeTransferFrom(token_, msg.sender, address(this), amount_);

        uint256 balance = token_.balanceOf(msg.sender);
        require(balance >= minBalanceAfter_, InsufficientBalance(balance, minBalanceAfter_));

        if (token_.allowance(address(this), address(orderReceiver)) < amount_) {
            SafeERC20.forceApprove(token_, address(orderReceiver), type(uint256).max);
        }
    }
}
