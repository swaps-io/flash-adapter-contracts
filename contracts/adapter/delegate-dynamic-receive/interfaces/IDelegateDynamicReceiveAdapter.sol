// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";

import {IOrderReceiver} from "../../../flash/order/interfaces/IOrderReceiver.sol";

interface IDelegateDynamicReceiveAdapter is IERC1271 {
    event DelegateDynamicAssetReceive(bytes32 indexed dynOrderHash, bytes32 indexed orderHash);

    error InvalidAmountRange(uint256 minAmount, uint256 maxAmount);
    error DynOrderAlreadyReceived(bytes32 dynOrderHash);
    error InsufficientBalance(uint256 balance, uint256 minBalance);
    error OrderAlreadyReceived(bytes32 orderHash);
    error OrderNotReceived(bytes32 orderHash);

    function orderReceiver() external view returns (IOrderReceiver);

    function receivedOrderHash(bytes32 dynOrderHash) external view returns (bytes32);

    function receiveDelegateAsset(IERC20 token, uint256 minAmount, uint256 maxAmount, uint256 minBalanceAfter, uint256 toAmountRate, bytes32 dynOrderHash, bytes32 resolver, bytes calldata resolverData) external;
}
