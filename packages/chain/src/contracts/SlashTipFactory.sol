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
import {ETHVaultAction} from "./ETHVaultAction.sol";

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
    UpgradeableBeacon public ethVaultActionBeacon;

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
        string indexed orgIdHash,
        string orgId,
        address indexed admin,
        address slashTip,
        address userRegistry,
        address tipAction,
        address tipToken
    );

    event BeaconUpgraded(string beaconName, address indexed oldImpl, address indexed newImpl);

    event TipActionCreated(
        string indexed orgIdHash,
        string orgId,
        address indexed admin,
        address tipAction,
        address tipToken
    );

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
        address _erc20VaultActionImpl,
        address _ethVaultActionImpl
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
        ethVaultActionBeacon = new UpgradeableBeacon(_ethVaultActionImpl, address(this));
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

        // Deploy all proxies with factory as temporary admin
        address factory = address(this);

        // 1. Deploy UserRegistry proxy
        userRegistry = address(new BeaconProxy(
            address(userRegistryBeacon),
            abi.encodeCall(UserRegistry.initialize, (factory, _orgId))
        ));

        // 2. Deploy TipERC1155 proxy
        tipToken = address(new BeaconProxy(
            address(tipERC1155Beacon),
            abi.encodeCall(TipERC1155.initialize, (factory, _tokenBaseURI, _contractURI))
        ));

        // 3. Deploy ERC1155MintAction proxy
        tipAction = address(new BeaconProxy(
            address(erc1155MintActionBeacon),
            abi.encodeCall(ERC1155MintAction.initialize, (factory, tipToken, _tokenId))
        ));

        // 4. Deploy SlashTip proxy
        slashTip = address(new BeaconProxy(
            address(slashTipBeacon),
            abi.encodeCall(SlashTip.initialize, (factory, userRegistry, tipAction, _orgId))
        ));

        // 5. Grant cross-contract permissions (factory has admin, so this works)
        TipERC1155(tipToken).grantRole(TipERC1155(tipToken).TIP_MINTER(), tipAction);
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), slashTip);

        // 6. Transfer all roles to actual admin
        bytes32 defaultAdmin = DEFAULT_ADMIN_ROLE;

        // UserRegistry roles
        UserRegistry(userRegistry).grantRole(defaultAdmin, _admin);
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), _admin);

        // TipERC1155 roles
        TipERC1155(tipToken).grantRole(defaultAdmin, _admin);
        TipERC1155(tipToken).grantRole(TipERC1155(tipToken).TIP_MINTER(), _admin);

        // ERC1155MintAction roles
        ERC1155MintAction(tipAction).grantRole(defaultAdmin, _admin);
        ERC1155MintAction(tipAction).grantRole(ERC1155MintAction(tipAction).ACTION_MANAGER(), _admin);

        // SlashTip roles
        SlashTip(slashTip).grantRole(defaultAdmin, _admin);
        SlashTip(slashTip).grantRole(SlashTip(slashTip).TIP_MANAGER(), _admin);

        // 7. Renounce factory's admin roles (must be last)
        UserRegistry(userRegistry).renounceRole(defaultAdmin, factory);
        UserRegistry(userRegistry).renounceRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), factory);
        TipERC1155(tipToken).renounceRole(defaultAdmin, factory);
        TipERC1155(tipToken).renounceRole(TipERC1155(tipToken).TIP_MINTER(), factory);
        ERC1155MintAction(tipAction).renounceRole(defaultAdmin, factory);
        ERC1155MintAction(tipAction).renounceRole(ERC1155MintAction(tipAction).ACTION_MANAGER(), factory);
        SlashTip(slashTip).renounceRole(defaultAdmin, factory);
        SlashTip(slashTip).renounceRole(SlashTip(slashTip).TIP_MANAGER(), factory);

        // 8. Store deployment info
        orgs[_orgId] = OrgDeployment({
            slashTip: slashTip,
            userRegistry: userRegistry,
            tipAction: tipAction,
            tipToken: tipToken,
            exists: true
        });
        orgIds.push(_orgId);

        emit OrgDeployed(_orgId, _orgId, _admin, slashTip, userRegistry, tipAction, tipToken);
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

        // Deploy all proxies with factory as temporary admin
        address factory = address(this);

        // 1. Deploy UserRegistry proxy
        userRegistry = address(new BeaconProxy(
            address(userRegistryBeacon),
            abi.encodeCall(UserRegistry.initialize, (factory, _orgId))
        ));

        // 2. Deploy TipERC20 proxy
        tipToken = address(new BeaconProxy(
            address(tipERC20Beacon),
            abi.encodeCall(TipERC20.initialize, (factory, _tokenName, _tokenSymbol, _tokenDecimals))
        ));

        // 3. Deploy ERC20MintAction proxy
        tipAction = address(new BeaconProxy(
            address(erc20MintActionBeacon),
            abi.encodeCall(ERC20MintAction.initialize, (factory, tipToken))
        ));

        // 4. Deploy SlashTip proxy
        slashTip = address(new BeaconProxy(
            address(slashTipBeacon),
            abi.encodeCall(SlashTip.initialize, (factory, userRegistry, tipAction, _orgId))
        ));

        // 5. Grant cross-contract permissions (factory has admin, so this works)
        TipERC20(tipToken).grantRole(TipERC20(tipToken).TIP_MINTER(), tipAction);
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), slashTip);

        // 6. Transfer all roles to actual admin
        bytes32 defaultAdmin = DEFAULT_ADMIN_ROLE;

        // UserRegistry roles
        UserRegistry(userRegistry).grantRole(defaultAdmin, _admin);
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), _admin);

        // TipERC20 roles
        TipERC20(tipToken).grantRole(defaultAdmin, _admin);
        TipERC20(tipToken).grantRole(TipERC20(tipToken).TIP_MINTER(), _admin);

        // ERC20MintAction roles
        ERC20MintAction(tipAction).grantRole(defaultAdmin, _admin);
        ERC20MintAction(tipAction).grantRole(ERC20MintAction(tipAction).ACTION_MANAGER(), _admin);

        // SlashTip roles
        SlashTip(slashTip).grantRole(defaultAdmin, _admin);
        SlashTip(slashTip).grantRole(SlashTip(slashTip).TIP_MANAGER(), _admin);

        // 7. Renounce factory's admin roles (must be last)
        UserRegistry(userRegistry).renounceRole(defaultAdmin, factory);
        UserRegistry(userRegistry).renounceRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), factory);
        TipERC20(tipToken).renounceRole(defaultAdmin, factory);
        TipERC20(tipToken).renounceRole(TipERC20(tipToken).TIP_MINTER(), factory);
        ERC20MintAction(tipAction).renounceRole(defaultAdmin, factory);
        ERC20MintAction(tipAction).renounceRole(ERC20MintAction(tipAction).ACTION_MANAGER(), factory);
        SlashTip(slashTip).renounceRole(defaultAdmin, factory);
        SlashTip(slashTip).renounceRole(SlashTip(slashTip).TIP_MANAGER(), factory);

        // 8. Store deployment info
        orgs[_orgId] = OrgDeployment({
            slashTip: slashTip,
            userRegistry: userRegistry,
            tipAction: tipAction,
            tipToken: tipToken,
            exists: true
        });
        orgIds.push(_orgId);

        emit OrgDeployed(_orgId, _orgId, _admin, slashTip, userRegistry, tipAction, tipToken);
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

        // Deploy all proxies with factory as temporary admin
        address factory = address(this);

        // 1. Deploy UserRegistry proxy
        userRegistry = address(new BeaconProxy(
            address(userRegistryBeacon),
            abi.encodeCall(UserRegistry.initialize, (factory, _orgId))
        ));

        // 2. Deploy ERC20VaultAction proxy
        tipAction = address(new BeaconProxy(
            address(erc20VaultActionBeacon),
            abi.encodeCall(ERC20VaultAction.initialize, (factory, _token))
        ));

        // 3. Deploy SlashTip proxy
        slashTip = address(new BeaconProxy(
            address(slashTipBeacon),
            abi.encodeCall(SlashTip.initialize, (factory, userRegistry, tipAction, _orgId))
        ));

        // 4. Grant cross-contract permissions (factory has admin, so this works)
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), slashTip);

        // 5. Transfer all roles to actual admin
        bytes32 defaultAdmin = DEFAULT_ADMIN_ROLE;

        // UserRegistry roles
        UserRegistry(userRegistry).grantRole(defaultAdmin, _admin);
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), _admin);

        // ERC20VaultAction roles
        ERC20VaultAction(tipAction).grantRole(defaultAdmin, _admin);
        ERC20VaultAction(tipAction).grantRole(ERC20VaultAction(tipAction).VAULT_MANAGER(), _admin);

        // SlashTip roles
        SlashTip(slashTip).grantRole(defaultAdmin, _admin);
        SlashTip(slashTip).grantRole(SlashTip(slashTip).TIP_MANAGER(), _admin);

        // 6. Renounce factory's admin roles (must be last)
        UserRegistry(userRegistry).renounceRole(defaultAdmin, factory);
        UserRegistry(userRegistry).renounceRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), factory);
        ERC20VaultAction(tipAction).renounceRole(defaultAdmin, factory);
        ERC20VaultAction(tipAction).renounceRole(ERC20VaultAction(tipAction).VAULT_MANAGER(), factory);
        SlashTip(slashTip).renounceRole(defaultAdmin, factory);
        SlashTip(slashTip).renounceRole(SlashTip(slashTip).TIP_MANAGER(), factory);

        // 7. Store deployment info (tipToken is the existing token for reference)
        orgs[_orgId] = OrgDeployment({
            slashTip: slashTip,
            userRegistry: userRegistry,
            tipAction: tipAction,
            tipToken: _token,
            exists: true
        });
        orgIds.push(_orgId);

        emit OrgDeployed(_orgId, _orgId, _admin, slashTip, userRegistry, tipAction, _token);
    }

    /// @notice Deploy a SlashTip setup with a native ETH vault
    /// @param _orgId Unique organization identifier
    /// @param _admin Admin address for the deployed contracts
    function deployWithETHVault(
        string calldata _orgId,
        address _admin
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

        // Deploy all proxies with factory as temporary admin
        address factory = address(this);

        // 1. Deploy UserRegistry proxy
        userRegistry = address(new BeaconProxy(
            address(userRegistryBeacon),
            abi.encodeCall(UserRegistry.initialize, (factory, _orgId))
        ));

        // 2. Deploy ETHVaultAction proxy
        tipAction = address(new BeaconProxy(
            address(ethVaultActionBeacon),
            abi.encodeCall(ETHVaultAction.initialize, (factory))
        ));

        // 3. Deploy SlashTip proxy
        slashTip = address(new BeaconProxy(
            address(slashTipBeacon),
            abi.encodeCall(SlashTip.initialize, (factory, userRegistry, tipAction, _orgId))
        ));

        // 4. Grant cross-contract permissions (factory has admin, so this works)
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), slashTip);

        // 5. Transfer all roles to actual admin
        bytes32 defaultAdmin = DEFAULT_ADMIN_ROLE;

        // UserRegistry roles
        UserRegistry(userRegistry).grantRole(defaultAdmin, _admin);
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), _admin);

        // ETHVaultAction roles
        ETHVaultAction(payable(tipAction)).grantRole(defaultAdmin, _admin);
        ETHVaultAction(payable(tipAction)).grantRole(ETHVaultAction(payable(tipAction)).VAULT_MANAGER(), _admin);

        // SlashTip roles
        SlashTip(slashTip).grantRole(defaultAdmin, _admin);
        SlashTip(slashTip).grantRole(SlashTip(slashTip).TIP_MANAGER(), _admin);

        // 6. Renounce factory's admin roles (must be last)
        UserRegistry(userRegistry).renounceRole(defaultAdmin, factory);
        UserRegistry(userRegistry).renounceRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), factory);
        ETHVaultAction(payable(tipAction)).renounceRole(defaultAdmin, factory);
        ETHVaultAction(payable(tipAction)).renounceRole(ETHVaultAction(payable(tipAction)).VAULT_MANAGER(), factory);
        SlashTip(slashTip).renounceRole(defaultAdmin, factory);
        SlashTip(slashTip).renounceRole(SlashTip(slashTip).TIP_MANAGER(), factory);

        // 7. Store deployment info (tipToken is address(0) for ETH vault)
        orgs[_orgId] = OrgDeployment({
            slashTip: slashTip,
            userRegistry: userRegistry,
            tipAction: tipAction,
            tipToken: address(0),
            exists: true
        });
        orgIds.push(_orgId);

        emit OrgDeployed(_orgId, _orgId, _admin, slashTip, userRegistry, tipAction, address(0));
    }

    // ============ Tip Action Update Functions ============

    /// @notice Create a new ERC1155 tip action for an existing org
    /// @dev After calling this, org admin must call slashTip.setTipAction(tipAction)
    /// @param _orgId The organization to create action for
    /// @param _admin Admin address for the new contracts
    /// @param _tokenBaseURI Base URI for token metadata
    /// @param _contractURI Contract-level metadata URI
    /// @param _tokenId The token ID to use for tips
    function createERC1155Action(
        string calldata _orgId,
        address _admin,
        string calldata _tokenBaseURI,
        string calldata _contractURI,
        uint256 _tokenId
    )
        external
        onlyRole(FACTORY_MANAGER)
        returns (address tipAction, address tipToken)
    {
        if (!orgs[_orgId].exists) revert OrgNotFound(_orgId);

        address factory = address(this);

        // 1. Deploy TipERC1155 proxy
        tipToken = address(new BeaconProxy(
            address(tipERC1155Beacon),
            abi.encodeCall(TipERC1155.initialize, (factory, _tokenBaseURI, _contractURI))
        ));

        // 2. Deploy ERC1155MintAction proxy
        tipAction = address(new BeaconProxy(
            address(erc1155MintActionBeacon),
            abi.encodeCall(ERC1155MintAction.initialize, (factory, tipToken, _tokenId))
        ));

        // 3. Grant cross-contract permissions
        TipERC1155(tipToken).grantRole(TipERC1155(tipToken).TIP_MINTER(), tipAction);

        // 4. Transfer roles to admin
        bytes32 defaultAdmin = DEFAULT_ADMIN_ROLE;

        TipERC1155(tipToken).grantRole(defaultAdmin, _admin);
        TipERC1155(tipToken).grantRole(TipERC1155(tipToken).TIP_MINTER(), _admin);
        ERC1155MintAction(tipAction).grantRole(defaultAdmin, _admin);
        ERC1155MintAction(tipAction).grantRole(ERC1155MintAction(tipAction).ACTION_MANAGER(), _admin);

        // 5. Renounce factory roles
        TipERC1155(tipToken).renounceRole(defaultAdmin, factory);
        TipERC1155(tipToken).renounceRole(TipERC1155(tipToken).TIP_MINTER(), factory);
        ERC1155MintAction(tipAction).renounceRole(defaultAdmin, factory);
        ERC1155MintAction(tipAction).renounceRole(ERC1155MintAction(tipAction).ACTION_MANAGER(), factory);

        emit TipActionCreated(_orgId, _orgId, _admin, tipAction, tipToken);
    }

    /// @notice Create a new ERC20 tip action for an existing org
    /// @dev After calling this, org admin must call slashTip.setTipAction(tipAction)
    /// @param _orgId The organization to create action for
    /// @param _admin Admin address for the new contracts
    /// @param _tokenName Name for the ERC20 token
    /// @param _tokenSymbol Symbol for the ERC20 token
    /// @param _tokenDecimals Decimals for the ERC20 token
    function createERC20Action(
        string calldata _orgId,
        address _admin,
        string calldata _tokenName,
        string calldata _tokenSymbol,
        uint8 _tokenDecimals
    )
        external
        onlyRole(FACTORY_MANAGER)
        returns (address tipAction, address tipToken)
    {
        if (!orgs[_orgId].exists) revert OrgNotFound(_orgId);

        address factory = address(this);

        // 1. Deploy TipERC20 proxy
        tipToken = address(new BeaconProxy(
            address(tipERC20Beacon),
            abi.encodeCall(TipERC20.initialize, (factory, _tokenName, _tokenSymbol, _tokenDecimals))
        ));

        // 2. Deploy ERC20MintAction proxy
        tipAction = address(new BeaconProxy(
            address(erc20MintActionBeacon),
            abi.encodeCall(ERC20MintAction.initialize, (factory, tipToken))
        ));

        // 3. Grant cross-contract permissions
        TipERC20(tipToken).grantRole(TipERC20(tipToken).TIP_MINTER(), tipAction);

        // 4. Transfer roles to admin
        bytes32 defaultAdmin = DEFAULT_ADMIN_ROLE;

        TipERC20(tipToken).grantRole(defaultAdmin, _admin);
        TipERC20(tipToken).grantRole(TipERC20(tipToken).TIP_MINTER(), _admin);
        ERC20MintAction(tipAction).grantRole(defaultAdmin, _admin);
        ERC20MintAction(tipAction).grantRole(ERC20MintAction(tipAction).ACTION_MANAGER(), _admin);

        // 5. Renounce factory roles
        TipERC20(tipToken).renounceRole(defaultAdmin, factory);
        TipERC20(tipToken).renounceRole(TipERC20(tipToken).TIP_MINTER(), factory);
        ERC20MintAction(tipAction).renounceRole(defaultAdmin, factory);
        ERC20MintAction(tipAction).renounceRole(ERC20MintAction(tipAction).ACTION_MANAGER(), factory);

        emit TipActionCreated(_orgId, _orgId, _admin, tipAction, tipToken);
    }

    /// @notice Create a new ERC20 vault tip action for an existing org
    /// @dev After calling this, org admin must call slashTip.setTipAction(tipAction)
    /// @param _orgId The organization to create action for
    /// @param _admin Admin address for the new contracts
    /// @param _token Address of the existing ERC20 token to use
    function createERC20VaultAction(
        string calldata _orgId,
        address _admin,
        address _token
    )
        external
        onlyRole(FACTORY_MANAGER)
        returns (address tipAction)
    {
        if (!orgs[_orgId].exists) revert OrgNotFound(_orgId);

        address factory = address(this);

        // 1. Deploy ERC20VaultAction proxy
        tipAction = address(new BeaconProxy(
            address(erc20VaultActionBeacon),
            abi.encodeCall(ERC20VaultAction.initialize, (factory, _token))
        ));

        // 2. Transfer roles to admin
        bytes32 defaultAdmin = DEFAULT_ADMIN_ROLE;

        ERC20VaultAction(tipAction).grantRole(defaultAdmin, _admin);
        ERC20VaultAction(tipAction).grantRole(ERC20VaultAction(tipAction).VAULT_MANAGER(), _admin);

        // 3. Renounce factory roles
        ERC20VaultAction(tipAction).renounceRole(defaultAdmin, factory);
        ERC20VaultAction(tipAction).renounceRole(ERC20VaultAction(tipAction).VAULT_MANAGER(), factory);

        emit TipActionCreated(_orgId, _orgId, _admin, tipAction, _token);
    }

    /// @notice Create a new ETH vault tip action for an existing org
    /// @dev After calling this, org admin must call slashTip.setTipAction(tipAction)
    /// @param _orgId The organization to create action for
    /// @param _admin Admin address for the new contract
    function createETHVaultAction(
        string calldata _orgId,
        address _admin
    )
        external
        onlyRole(FACTORY_MANAGER)
        returns (address tipAction)
    {
        if (!orgs[_orgId].exists) revert OrgNotFound(_orgId);

        address factory = address(this);

        // 1. Deploy ETHVaultAction proxy
        tipAction = address(new BeaconProxy(
            address(ethVaultActionBeacon),
            abi.encodeCall(ETHVaultAction.initialize, (factory))
        ));

        // 2. Transfer roles to admin
        bytes32 defaultAdmin = DEFAULT_ADMIN_ROLE;

        ETHVaultAction(payable(tipAction)).grantRole(defaultAdmin, _admin);
        ETHVaultAction(payable(tipAction)).grantRole(ETHVaultAction(payable(tipAction)).VAULT_MANAGER(), _admin);

        // 3. Renounce factory roles
        ETHVaultAction(payable(tipAction)).renounceRole(defaultAdmin, factory);
        ETHVaultAction(payable(tipAction)).renounceRole(ETHVaultAction(payable(tipAction)).VAULT_MANAGER(), factory);

        emit TipActionCreated(_orgId, _orgId, _admin, tipAction, address(0));
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

    /// @notice Upgrade the ETHVaultAction implementation for all orgs
    function upgradeETHVaultAction(address _newImpl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        address oldImpl = ethVaultActionBeacon.implementation();
        ethVaultActionBeacon.upgradeTo(_newImpl);
        emit BeaconUpgraded("ETHVaultAction", oldImpl, _newImpl);
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
        address _erc20VaultActionBeacon,
        address _ethVaultActionBeacon
    ) {
        return (
            address(slashTipBeacon),
            address(userRegistryBeacon),
            address(tipERC1155Beacon),
            address(tipERC20Beacon),
            address(erc1155MintActionBeacon),
            address(erc20MintActionBeacon),
            address(erc20VaultActionBeacon),
            address(ethVaultActionBeacon)
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
        address _erc20VaultActionImpl,
        address _ethVaultActionImpl
    ) {
        return (
            slashTipBeacon.implementation(),
            userRegistryBeacon.implementation(),
            tipERC1155Beacon.implementation(),
            tipERC20Beacon.implementation(),
            erc1155MintActionBeacon.implementation(),
            erc20MintActionBeacon.implementation(),
            erc20VaultActionBeacon.implementation(),
            ethVaultActionBeacon.implementation()
        );
    }
}
