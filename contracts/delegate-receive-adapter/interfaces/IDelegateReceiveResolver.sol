// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {Order} from "../../flash/order/interfaces/Order.sol";

interface IDelegateReceiveResolver {
    function receiveDelegateOrderAsset(Order calldata order, bytes calldata orderMetadata) external;
}
