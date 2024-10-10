// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {IOrderReceiver} from "../flash/order/interfaces/IOrderReceiver.sol";

struct ReceiveOrderMock {
    address fromActor;
    address fromToken;
    uint256 fromAmount;
    address toActor;
}

contract OrderReceiverMock is IOrderReceiver {
    error OrderAlreadyReceived(bytes32 orderHash);
    error InvalidSignature();
    error ReceiveCallerMismatch();

    mapping(bytes32 orderHash => bool) public orderAssetReceived;

    function receiveOrderAsset(ReceiveOrderMock calldata order_, bytes calldata fromSignature_) external {
        require(msg.sender == order_.toActor, ReceiveCallerMismatch());

        bytes32 orderHash = calcOrderMockHash(order_);
        require(!orderAssetReceived[orderHash], OrderAlreadyReceived(orderHash));

        require(SignatureChecker.isValidSignatureNow(order_.fromActor, orderHash, fromSignature_), InvalidSignature());

        orderAssetReceived[orderHash] = true;

        SafeERC20.safeTransferFrom(IERC20(order_.fromToken), order_.fromActor, msg.sender, order_.fromAmount);
    }

    function calcOrderMockHash(ReceiveOrderMock calldata order_) public pure returns (bytes32) {
        return keccak256(abi.encode(order_));
    }
}
