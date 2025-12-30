// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {BeaconProxy} from "openzeppelin/proxy/beacon/BeaconProxy.sol";
import {UpgradeableBeacon} from "openzeppelin/proxy/beacon/UpgradeableBeacon.sol";
import {UserRegistry} from "./UserRegistry.sol";
import {SlashTip} from "./SlashTip.sol";
import {TipERC1155} from "./TipERC1155.sol";
import {TipERC20} from "./TipERC20.sol";
import {ERC1155MintAction} from "./ERC1155MintAction.sol";
import {ERC20MintAction} from "./ERC20MintAction.sol";
import {ERC20VaultAction} from "./ERC20VaultAction.sol";

/// @title SlashTipFactory
/// @notice Factory contract for deploying SlashTip instances using Beacon Proxies
/// @dev Uses UpgradeableBeacon pattern for upgradeable multi-tenant deployments
contract SlashTipFactory is AccessControl {
    bytes32 public constant FACTORY_MANAGER = keccak256("FACTORY_MANAGER");

    // Beacons for each contract type
    UpgradeableBeacon public slashTipBeacon;
    UpgradeableBeacon public userRegistryBeacon;
    UpgradeableBeacon public tipERC1155Beacon;
    UpgradeableBeacon public tipERC20Beacon;
    UpgradeableBeacon public erc1155MintActionBeacon;
    UpgradeableBeacon public erc20MintActionBeacon;
    UpgradeableBeacon public erc20VaultActionBeacon;

    struct OrgDeployment {
        address slashTip;
        address userRegistry;
        address tipAction;
        address tipToken; // address(0) if using vault action
        bool exists;
    }

    mapping(string => OrgDeployment) public orgs;
    string[] public orgIds;

    event OrgDeployed(
        string indexed orgId,
        address indexed admin,
        address slashTip,
        address userRegistry,
        address tipAction,
        address tipToken
    );

    event BeaconUpgraded(string beaconName, address indexed oldImpl, address indexed newImpl);

    error OrgAlreadyExists(string orgId);
    error OrgNotFound(string orgId);

    constructor(
        address _admin,
        address _slashTipImpl,
        address _userRegistryImpl,
        address _tipERC1155Impl,
        address _tipERC20Impl,
        address _erc1155MintActionImpl,
        address _erc20MintActionImpl,
        address _erc20VaultActionImpl
    ) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(FACTORY_MANAGER, _admin);

        // Create beacons pointing to implementation contracts
        slashTipBeacon = new UpgradeableBeacon(_slashTipImpl, address(this));
        userRegistryBeacon = new UpgradeableBeacon(_userRegistryImpl, address(this));
        tipERC1155Beacon = new UpgradeableBeacon(_tipERC1155Impl, address(this));
        tipERC20Beacon = new UpgradeableBeacon(_tipERC20Impl, address(this));
        erc1155MintActionBeacon = new UpgradeableBeacon(_erc1155MintActionImpl, address(this));
        erc20MintActionBeacon = new UpgradeableBeacon(_erc20MintActionImpl, address(this));
        erc20VaultActionBeacon = new UpgradeableBeacon(_erc20VaultActionImpl, address(this));
    }

    /// @notice Deploy a full SlashTip setup with a new ERC1155 token
    /// @param _orgId Unique organization identifier
    /// @param _admin Admin address for the deployed contracts
    /// @param _tokenBaseURI Base URI for token metadata
    /// @param _contractURI Contract-level metadata URI
    /// @param _tokenId The token ID to use for tips
    function deployWithERC1155(
        string calldata _orgId,
        address _admin,
        string calldata _tokenBaseURI,
        string calldata _contractURI,
        uint256 _tokenId
    )
        external
        onlyRole(FACTORY_MANAGER)
        returns (
            address slashTip,
            address userRegistry,
            address tipAction,
            address tipToken
        )
    {
        if (orgs[_orgId].exists) revert OrgAlreadyExists(_orgId);

        // 1. Deploy UserRegistry proxy
        userRegistry = address(new BeaconProxy(
            address(userRegistryBeacon),
            abi.encodeCall(UserRegistry.initialize, (_admin, _orgId))
        ));

        // 2. Deploy TipERC1155 proxy
        tipToken = address(new BeaconProxy(
            address(tipERC1155Beacon),
            abi.encodeCall(TipERC1155.initialize, (_admin, _tokenBaseURI, _contractURI))
        ));

        // 3. Deploy ERC1155MintAction proxy
        tipAction = address(new BeaconProxy(
            address(erc1155MintActionBeacon),
            abi.encodeCall(ERC1155MintAction.initialize, (_admin, tipToken, _tokenId))
        ));

        // 4. Deploy SlashTip proxy
        slashTip = address(new BeaconProxy(
            address(slashTipBeacon),
            abi.encodeCall(SlashTip.initialize, (_admin, userRegistry, tipAction, _orgId))
        ));

        // 5. Grant cross-contract permissions
        // TipAction needs TIP_MINTER role on Tip token
        TipERC1155(tipToken).grantRole(TipERC1155(tipToken).TIP_MINTER(), tipAction);

        // SlashTip needs REGISTRY_MANAGER role on UserRegistry
        UserRegistry(userRegistry).grantRole(
            UserRegistry(userRegistry).REGISTRY_MANAGER(),
            slashTip
        );

        // SlashTip needs TIP_MANAGER role (already granted to admin in initialize)

        // 6. Store deployment info
        orgs[_orgId] = OrgDeployment({
            slashTip: slashTip,
            userRegistry: userRegistry,
            tipAction: tipAction,
            tipToken: tipToken,
            exists: true
        });
        orgIds.push(_orgId);

        emit OrgDeployed(_orgId, _admin, slashTip, userRegistry, tipAction, tipToken);
    }

    /// @notice Deploy a full SlashTip setup with a new ERC20 token
    /// @param _orgId Unique organization identifier
    /// @param _admin Admin address for the deployed contracts
    /// @param _tokenName Name for the ERC20 token
    /// @param _tokenSymbol Symbol for the ERC20 token
    /// @param _tokenDecimals Decimals for the ERC20 token
    function deployWithERC20(
        string calldata _orgId,
        address _admin,
        string calldata _tokenName,
        string calldata _tokenSymbol,
        uint8 _tokenDecimals
    )
        external
        onlyRole(FACTORY_MANAGER)
        returns (
            address slashTip,
            address userRegistry,
            address tipAction,
            address tipToken
        )
    {
        if (orgs[_orgId].exists) revert OrgAlreadyExists(_orgId);

        // 1. Deploy UserRegistry proxy
        userRegistry = address(new BeaconProxy(
            address(userRegistryBeacon),
            abi.encodeCall(UserRegistry.initialize, (_admin, _orgId))
        ));

        // 2. Deploy TipERC20 proxy
        tipToken = address(new BeaconProxy(
            address(tipERC20Beacon),
            abi.encodeCall(TipERC20.initialize, (_admin, _tokenName, _tokenSymbol, _tokenDecimals))
        ));

        // 3. Deploy ERC20MintAction proxy
        tipAction = address(new BeaconProxy(
            address(erc20MintActionBeacon),
            abi.encodeCall(ERC20MintAction.initialize, (_admin, tipToken))
        ));

        // 4. Deploy SlashTip proxy
        slashTip = address(new BeaconProxy(
            address(slashTipBeacon),
            abi.encodeCall(SlashTip.initialize, (_admin, userRegistry, tipAction, _orgId))
        ));

        // 5. Grant cross-contract permissions
        TipERC20(tipToken).grantRole(TipERC20(tipToken).TIP_MINTER(), tipAction);
        UserRegistry(userRegistry).grantRole(
            UserRegistry(userRegistry).REGISTRY_MANAGER(),
            slashTip
        );

        // 6. Store deployment info
        orgs[_orgId] = OrgDeployment({
            slashTip: slashTip,
            userRegistry: userRegistry,
            tipAction: tipAction,
            tipToken: tipToken,
            exists: true
        });
        orgIds.push(_orgId);

        emit OrgDeployed(_orgId, _admin, slashTip, userRegistry, tipAction, tipToken);
    }

    /// @notice Deploy a SlashTip setup with an ERC20 vault (uses existing token)
    /// @param _orgId Unique organization identifier
    /// @param _admin Admin address for the deployed contracts
    /// @param _token Address of the existing ERC20 token to use
    function deployWithERC20Vault(
        string calldata _orgId,
        address _admin,
        address _token
    )
        external
        onlyRole(FACTORY_MANAGER)
        returns (
            address slashTip,
            address userRegistry,
            address tipAction
        )
    {
        if (orgs[_orgId].exists) revert OrgAlreadyExists(_orgId);

        // 1. Deploy UserRegistry proxy
        userRegistry = address(new BeaconProxy(
            address(userRegistryBeacon),
            abi.encodeCall(UserRegistry.initialize, (_admin, _orgId))
        ));

        // 2. Deploy ERC20VaultAction proxy
        tipAction = address(new BeaconProxy(
            address(erc20VaultActionBeacon),
            abi.encodeCall(ERC20VaultAction.initialize, (_admin, _token))
        ));

        // 3. Deploy SlashTip proxy
        slashTip = address(new BeaconProxy(
            address(slashTipBeacon),
            abi.encodeCall(SlashTip.initialize, (_admin, userRegistry, tipAction, _orgId))
        ));

        // 4. Grant cross-contract permissions
        UserRegistry(userRegistry).grantRole(
            UserRegistry(userRegistry).REGISTRY_MANAGER(),
            slashTip
        );

        // 5. Store deployment info (tipToken is the existing token for reference)
        orgs[_orgId] = OrgDeployment({
            slashTip: slashTip,
            userRegistry: userRegistry,
            tipAction: tipAction,
            tipToken: _token,
            exists: true
        });
        orgIds.push(_orgId);

        emit OrgDeployed(_orgId, _admin, slashTip, userRegistry, tipAction, _token);
    }

    // ============ Beacon Upgrade Functions ============

    /// @notice Upgrade the SlashTip implementation for all orgs
    function upgradeSlashTip(address _newImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldImpl = slashTipBeacon.implementation();
        slashTipBeacon.upgradeTo(_newImpl);
        emit BeaconUpgraded("SlashTip", oldImpl, _newImpl);
    }

    /// @notice Upgrade the UserRegistry implementation for all orgs
    function upgradeUserRegistry(address _newImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldImpl = userRegistryBeacon.implementation();
        userRegistryBeacon.upgradeTo(_newImpl);
        emit BeaconUpgraded("UserRegistry", oldImpl, _newImpl);
    }

    /// @notice Upgrade the TipERC1155 implementation for all orgs
    function upgradeTipERC1155(address _newImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldImpl = tipERC1155Beacon.implementation();
        tipERC1155Beacon.upgradeTo(_newImpl);
        emit BeaconUpgraded("TipERC1155", oldImpl, _newImpl);
    }

    /// @notice Upgrade the TipERC20 implementation for all orgs
    function upgradeTipERC20(address _newImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldImpl = tipERC20Beacon.implementation();
        tipERC20Beacon.upgradeTo(_newImpl);
        emit BeaconUpgraded("TipERC20", oldImpl, _newImpl);
    }

    /// @notice Upgrade the ERC1155MintAction implementation for all orgs
    function upgradeERC1155MintAction(address _newImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldImpl = erc1155MintActionBeacon.implementation();
        erc1155MintActionBeacon.upgradeTo(_newImpl);
        emit BeaconUpgraded("ERC1155MintAction", oldImpl, _newImpl);
    }

    /// @notice Upgrade the ERC20MintAction implementation for all orgs
    function upgradeERC20MintAction(address _newImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldImpl = erc20MintActionBeacon.implementation();
        erc20MintActionBeacon.upgradeTo(_newImpl);
        emit BeaconUpgraded("ERC20MintAction", oldImpl, _newImpl);
    }

    /// @notice Upgrade the ERC20VaultAction implementation for all orgs
    function upgradeERC20VaultAction(address _newImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldImpl = erc20VaultActionBeacon.implementation();
        erc20VaultActionBeacon.upgradeTo(_newImpl);
        emit BeaconUpgraded("ERC20VaultAction", oldImpl, _newImpl);
    }

    // ============ View Functions ============

    /// @notice Get deployment info for an organization
    function getOrg(string calldata _orgId) external view returns (OrgDeployment memory) {
        if (!orgs[_orgId].exists) revert OrgNotFound(_orgId);
        return orgs[_orgId];
    }

    /// @notice Check if an organization exists
    function orgExists(string calldata _orgId) external view returns (bool) {
        return orgs[_orgId].exists;
    }

    /// @notice Get the total number of deployed organizations
    function orgCount() external view returns (uint256) {
        return orgIds.length;
    }

    /// @notice Get all organization IDs
    function listOrgIds() external view returns (string[] memory) {
        return orgIds;
    }

    /// @notice Get all beacon addresses
    function getBeacons() external view returns (
        address _slashTipBeacon,
        address _userRegistryBeacon,
        address _tipERC1155Beacon,
        address _tipERC20Beacon,
        address _erc1155MintActionBeacon,
        address _erc20MintActionBeacon,
        address _erc20VaultActionBeacon
    ) {
        return (
            address(slashTipBeacon),
            address(userRegistryBeacon),
            address(tipERC1155Beacon),
            address(tipERC20Beacon),
            address(erc1155MintActionBeacon),
            address(erc20MintActionBeacon),
            address(erc20VaultActionBeacon)
        );
    }

    /// @notice Get all implementation addresses
    function getImplementations() external view returns (
        address _slashTipImpl,
        address _userRegistryImpl,
        address _tipERC1155Impl,
        address _tipERC20Impl,
        address _erc1155MintActionImpl,
        address _erc20MintActionImpl,
        address _erc20VaultActionImpl
    ) {
        return (
            slashTipBeacon.implementation(),
            userRegistryBeacon.implementation(),
            tipERC1155Beacon.implementation(),
            tipERC20Beacon.implementation(),
            erc1155MintActionBeacon.implementation(),
            erc20MintActionBeacon.implementation(),
            erc20VaultActionBeacon.implementation()
        );
    }
}
