// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

library RateLib {
    uint256 private constant RATE_FACTOR = 1_000000000_000000000_000000000_000000000;

    function calcRate(uint256 input_, uint256 output_) internal pure returns (uint256 rate) {
        if (input_ == 0) return 0;
        return Math.mulDiv(output_, RATE_FACTOR, input_);
    }

    function applyRate(uint256 input_, uint256 rate_) internal pure returns (uint256 output) {
        return Math.mulDiv(input_, rate_, RATE_FACTOR);
    }
}
