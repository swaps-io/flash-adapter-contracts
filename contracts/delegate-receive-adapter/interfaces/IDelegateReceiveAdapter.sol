// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";

import {IOrderReceiver} from "../../flash/order/interfaces/IOrderReceiver.sol";
import {Order} from "../../flash/order/interfaces/Order.sol";

interface IDelegateReceiveAdapter is IERC1271 {
    event AssetDelegateReceive(bytes32 indexed orderHash);

    error FromActorMismatch(address fromActor, address expectedFromActor);
    error InsufficientBalance(uint256 balance, uint256 minBalance);
    error OrderAlreadyReceived(bytes32 orderHash);
    error OrderNotReceived(bytes32 orderHash);

    function orderReceiver() external view returns (IOrderReceiver);

    function receiveDelegateOrderAsset(Order calldata order, bytes calldata orderMetadata, uint256 minBalanceAfter) external;
}
