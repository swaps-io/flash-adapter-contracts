// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {RateLib} from "../rate/RateLib.sol";

contract RateLibTest {
    function calcRate(uint256 input_, uint256 output_) external pure returns (uint256 rate) {
        return RateLib.calcRate(input_, output_);
    }

    function applyRate(uint256 input_, uint256 rate_) external pure returns (uint256 output) {
        return RateLib.applyRate(input_, rate_);
    }
}
