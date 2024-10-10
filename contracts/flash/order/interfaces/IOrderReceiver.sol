// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

interface IOrderReceiver {
    function orderAssetReceived(bytes32 orderHash) external view returns (bool);
}
