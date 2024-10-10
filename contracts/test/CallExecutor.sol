// SPDX-License-Identifier: BUSL-1.1

pragma solidity ^0.8.26;

struct Call {
    address target;
    uint256 value;
    bytes callData;
    bool allowFailure;
    bool isDelegateCall;
}

contract CallExecutor {
    function executeCalls(Call[] calldata calls_) external {
        for (uint256 i = 0; i < calls_.length; i++) {
            Call calldata call = calls_[i];

            bool success;
            bytes memory ret;
            if (call.isDelegateCall) {
                (success, ret) = call.target.delegatecall(call.callData);
            } else {
                (success, ret) = call.target.call{value: call.value}(call.callData);
            }

            if (!success && !call.allowFailure) {
                assembly {
                    revert(add(ret, 0x20), mload(ret))
                }
            }
        }
    }
}
