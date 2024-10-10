// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TokenMock is ERC20 {
    constructor() ERC20("TokenMock", "TM") {}

    function mint(address account_, uint256 amount_) external {
        _mint(account_, amount_);
    }
}
