// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IDelegateReceiveAdapter, IOrderReceiver, IDelegateReceiveResolver} from "./interfaces/IDelegateReceiveAdapter.sol";

contract DelegateReceiveAdapter is IDelegateReceiveAdapter {
    IOrderReceiver public immutable orderReceiver;

    constructor(IOrderReceiver orderReceiver_) {
        orderReceiver = orderReceiver_;
    }

    function receiveDelegateAsset(IERC20 token_, uint256 amount_, uint256 minBalanceAfter_, bytes32 orderHash_, IDelegateReceiveResolver resolver_, bytes calldata resolverData_) external {
        require(!orderReceiver.orderAssetReceived(orderHash_), OrderAlreadyReceived(orderHash_));

        SafeERC20.safeTransferFrom(token_, msg.sender, address(this), amount_);
        if (token_.allowance(address(this), address(orderReceiver)) < amount_) {
            SafeERC20.forceApprove(token_, address(orderReceiver), type(uint256).max);
        }

        resolver_.receiveDelegateOrderAsset(resolverData_);

        require(orderReceiver.orderAssetReceived(orderHash_), OrderNotReceived(orderHash_));
        uint256 balanceAfter = token_.balanceOf(msg.sender);
        require(balanceAfter >= minBalanceAfter_, InsufficientBalanceAfter(balanceAfter, minBalanceAfter_));

        emit DelegateAssetReceive(orderHash_);
    }

    function isValidSignature(bytes32, bytes memory) external pure returns (bytes4) {
        return this.isValidSignature.selector;
    }
}
