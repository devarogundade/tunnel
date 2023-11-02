// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IWormhole.sol";

import "./interfaces/IERC3643.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Tunnel is Context {
    IWormhole private _wormhole;

    uint32 private _nonce;

    mapping(uint32 => bool) private _delivered;

    mapping(bytes32 => address) private _evmWallet;
    mapping(address => bytes32) private _algoWallet;

    mapping(uint256 => address) private _evmAsset;
    mapping(address => uint256) private _algoAsset;

    uint256 private GAS_LIMIT;
    uint8 private CONSISTENCY_LEVEL = 200;

    event AssetLocked(
        address assetId,
        uint256 amount,
        address evmWallet,
        bytes32 algoWallet,
        uint256 timestamp
    );

    event AssetReleased(
        address assetId,
        uint256 amount,
        bytes32 algoWallet,
        address evmWallet,
        uint256 timestamp
    );

    event WalletCreated(address evmWallet, bytes32 algoWallet);

    constructor(address wormhole_) {
        _wormhole = IWormhole(wormhole_);
    }

    function createWallet(bytes32 algoWallet) external {
        address evmWallet = _msgSender();

        require(
            _algoWallet[evmWallet] == bytes32(0),
            "Algo wallet already used"
        );

        require(
            _evmWallet[algoWallet] == address(0),
            "Evm wallet already used"
        );

        _algoWallet[evmWallet] = algoWallet;
        _evmWallet[algoWallet] = evmWallet;

        emit WalletCreated(evmWallet, algoWallet);
    }

    /// @dev For getting briging fee
    function messageFee() public view returns (uint256) {
        return _wormhole.messageFee();
    }

    /// @dev This function locks the Original NFT
    /// and tell whirlExtension Contract to mint a new similar NFT
    function bridge(address assetId, uint256 amount) external payable {
        address caller = _msgSender();

        IERC3643 asset = IERC3643(assetId);
        asset.transferFrom(caller, address(this), amount);

        bytes memory payload = abi.encode(
            _algoAsset[assetId],
            _algoAmount(amount),
            _algoWallet[caller]
        );

        _wormhole.publishMessage{value: messageFee()}(
            _nonce,
            payload,
            CONSISTENCY_LEVEL
        );

        _nonce++;

        emit AssetLocked(
            assetId,
            amount,
            caller,
            _algoWallet[caller],
            block.timestamp
        );
    }

    // @dev This function unlocks the Original asset to the
    function receiveMessage(uint32 nonce, bytes memory payload) external {
        // Ensure no duplicate deliveries
        require(!_delivered[nonce], "Message already processed");
        _delivered[nonce] = true;

        // Parse the payload and do the corresponding actions!
        (uint256 assetId, uint256 amount, bytes32 algoWallet) = abi.decode(
            payload,
            (uint256, uint256, bytes32)
        );

        IERC3643 asset = IERC3643(_evmAsset[assetId]);
        asset.transfer(_evmWallet[algoWallet], _evmAmount(amount));

        emit AssetReleased(
            _evmAsset[assetId],
            _evmAmount(amount),
            algoWallet,
            _evmWallet[algoWallet],
            block.timestamp
        );
    }

    function _evmAmount(uint256 amount) private pure returns (uint256) {
        return amount * 100_000;
    }

    function _algoAmount(uint256 amount) private pure returns (uint256) {
        return amount / 100_000;
    }

    receive() external payable {}
}
