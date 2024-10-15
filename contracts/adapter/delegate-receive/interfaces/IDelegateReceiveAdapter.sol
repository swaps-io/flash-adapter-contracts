// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";

import {IOrderReceiver} from "../../../flash/order/interfaces/IOrderReceiver.sol";

interface IDelegateReceiveAdapter is IERC1271 {
    event DelegateAssetReceive(bytes32 indexed orderHash);

    error OrderAlreadyReceived(bytes32 orderHash);
    error OrderNotReceived(bytes32 orderHash);
    error InsufficientBalanceAfter(uint256 balance, uint256 minBalance);

    function orderReceiver() external view returns (IOrderReceiver);

    function receiveDelegateAsset(IERC20 token, uint256 amount, uint256 minBalanceAfter, bytes32 orderHash, address resolver, bytes calldata resolverData) external;
}
