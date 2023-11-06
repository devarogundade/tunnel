// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./interfaces/IWormhole.sol";

import "./interfaces/IERC3643.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract Tunnel is Context {
    IWormhole private _wormhole;

    uint32 private _nonce;

    mapping(uint32 => bool) private _delivered;

    mapping(string => address) private _evmWallet;
    mapping(address => string) private _algoWallet;

    mapping(uint256 => address) private _evmAsset;
    mapping(address => uint256) private _algoAsset;

    uint256 private GAS_LIMIT;
    uint8 private CONSISTENCY_LEVEL = 200;

    event AssetLocked(
        address assetId,
        uint256 amount,
        address evmWallet,
        string algoWallet,
        uint256 timestamp
    );

    event AssetReleased(
        address assetId,
        uint256 amount,
        string algoWallet,
        address evmWallet,
        uint256 timestamp
    );

    event WalletCreated(address evmWallet, string algoWallet);

    event FaucetDispensed(address evmWallet, uint256 amount);

    constructor(address wormhole_) {
        _wormhole = IWormhole(wormhole_);
    }

    function faucet(address assetId, uint256 amount) external {
        address evmWallet = _msgSender();

        IERC3643 asset = IERC3643(assetId);
        asset.transfer(evmWallet, amount);

        emit FaucetDispensed(evmWallet, amount);
    }

    function createAsset(address evmAssetId, uint256 algoAssetId) external {
        _evmAsset[evmAssetId] = algoAssetId;
    }

    function createWallet(string memory algoWallet) external {
        address evmWallet = _msgSender();

        // require(
        //     _algoWallet[evmWallet] == bytes32(0),
        //     "Algo wallet already used"
        // );

        require(
            _evmWallet[algoWallet] == address(0),
            "Evm wallet already used"
        );

        _algoWallet[evmWallet] = algoWallet;
        _evmWallet[algoWallet] = evmWallet;

        emit WalletCreated(evmWallet, algoWallet);
    }

    function getAlgoWallet(
        address evmWallet
    ) external view returns (string memory) {
        return _algoWallet[evmWallet];
    }

    /// @dev For getting briging fee
    function messageFee() public view returns (uint256) {
        return _wormhole.messageFee();
    }

    /// @dev This function locks the Original NFT
    /// and tell whirlExtension Contract to mint a new similar NFT
    function bridge(address assetId, uint256 amount) external payable {
        address evmWallet = _msgSender();

        // require(_algoWallet[evmWallet] != bytes32(0), "Algo address not set");

        IERC3643 asset = IERC3643(assetId);
        asset.transferFrom(evmWallet, address(this), amount);

        bytes memory payload = abi.encode(
            _algoAsset[assetId],
            _algoAmount(amount),
            _algoWallet[evmWallet]
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
            evmWallet,
            _algoWallet[evmWallet],
            block.timestamp
        );
    }

    // @dev This function unlocks the Original asset to the
    function receiveMessage(uint32 nonce, bytes memory payload) external {
        // Ensure no duplicate deliveries
        require(!_delivered[nonce], "Message already processed");
        _delivered[nonce] = true;

        // Parse the payload and do the corresponding actions!
        (uint256 assetId, uint256 amount, string memory algoWallet) = abi
            .decode(payload, (uint256, uint256, string));

        require(_evmWallet[algoWallet] != address(0), "Evm address not set");

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

    function _evmAmount(uint256 algoAmmount) private pure returns (uint256) {
        return algoAmmount * 1_000_000_000_000;
    }

    function _algoAmount(uint256 evmAmount) private pure returns (uint256) {
        return evmAmount / 1_000_000_000_000;
    }

    receive() external payable {}
}
