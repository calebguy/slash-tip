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

    // Beacons for each contract type
    UpgradeableBeacon public slashTipBeacon;
    UpgradeableBeacon public userRegistryBeacon;
    UpgradeableBeacon public tipERC1155Beacon;
    UpgradeableBeacon public tipERC20Beacon;
    UpgradeableBeacon public erc1155MintActionBeacon;
    UpgradeableBeacon public erc20MintActionBeacon;
    UpgradeableBeacon public erc20VaultActionBeacon;
    UpgradeableBeacon public ethVaultActionBeacon;

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
        address indexed slashTip,
        address indexed admin,
        address tipAction,
        address tipToken
    );

    error InvalidAddress();

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
        if (_admin == address(0)) revert InvalidAddress();
        if (_slashTipImpl == address(0)) revert InvalidAddress();
        if (_userRegistryImpl == address(0)) revert InvalidAddress();
        if (_tipERC1155Impl == address(0)) revert InvalidAddress();
        if (_tipERC20Impl == address(0)) revert InvalidAddress();
        if (_erc1155MintActionImpl == address(0)) revert InvalidAddress();
        if (_erc20MintActionImpl == address(0)) revert InvalidAddress();
        if (_erc20VaultActionImpl == address(0)) revert InvalidAddress();
        if (_ethVaultActionImpl == address(0)) revert InvalidAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);

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
    /// @param _admin Admin address for role management (gets DEFAULT_ADMIN_ROLE, PAUSER)
    /// @param _operators Operator addresses for daily operations (each gets operational roles)
    /// @param _tokenBaseURI Base URI for token metadata
    /// @param _contractURI Contract-level metadata URI
    /// @param _tokenId The token ID to use for tips
    function deployWithERC1155(
        string calldata _orgId,
        address _admin,
        address[] calldata _operators,
        string calldata _tokenBaseURI,
        string calldata _contractURI,
        uint256 _tokenId
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (
            address slashTip,
            address userRegistry,
            address tipAction,
            address tipToken
        )
    {
        if (_admin == address(0)) revert InvalidAddress();
        if (_operators.length == 0) revert InvalidAddress();

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

        // 5. Grant cross-contract permissions (internal roles)
        TipERC1155(tipToken).grantRole(TipERC1155(tipToken).MINTER(), tipAction);
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_MANAGER(), slashTip); // SlashTip needs to call subUserAllowance
        ERC1155MintAction(tipAction).grantRole(ERC1155MintAction(tipAction).EXECUTOR(), slashTip);

        // 6. Grant admin roles to _admin
        UserRegistry(userRegistry).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        TipERC1155(tipToken).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ERC1155MintAction(tipAction).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        SlashTip(slashTip).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        SlashTip(slashTip).grantRole(SlashTip(slashTip).PAUSER(), _admin);

        // 7. Grant operational roles to each operator
        for (uint256 i = 0; i < _operators.length; i++) {
            if (_operators[i] == address(0)) revert InvalidAddress();
            // UserRegistry roles
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).USER_MANAGER(), _operators[i]);
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_MANAGER(), _operators[i]);
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_ADMIN(), _operators[i]);
            // Token roles
            TipERC1155(tipToken).grantRole(TipERC1155(tipToken).METADATA_MANAGER(), _operators[i]);
            // Action roles
            ERC1155MintAction(tipAction).grantRole(ERC1155MintAction(tipAction).CONFIG_MANAGER(), _operators[i]);
            // SlashTip roles
            SlashTip(slashTip).grantRole(SlashTip(slashTip).TIPPER(), _operators[i]);
        }

        // 8. Renounce factory's admin roles
        UserRegistry(userRegistry).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        TipERC1155(tipToken).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        ERC1155MintAction(tipAction).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        SlashTip(slashTip).renounceRole(DEFAULT_ADMIN_ROLE, factory);

        emit OrgDeployed(_orgId, _orgId, _admin, slashTip, userRegistry, tipAction, tipToken);
    }

    /// @notice Deploy a full SlashTip setup with a new ERC20 token
    /// @param _orgId Unique organization identifier
    /// @param _admin Admin address for role management (gets DEFAULT_ADMIN_ROLE, PAUSER)
    /// @param _operators Operator addresses for daily operations (each gets operational roles)
    /// @param _tokenName Name for the ERC20 token
    /// @param _tokenSymbol Symbol for the ERC20 token
    /// @param _tokenDecimals Decimals for the ERC20 token
    function deployWithERC20(
        string calldata _orgId,
        address _admin,
        address[] calldata _operators,
        string calldata _tokenName,
        string calldata _tokenSymbol,
        uint8 _tokenDecimals
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (
            address slashTip,
            address userRegistry,
            address tipAction,
            address tipToken
        )
    {
        if (_admin == address(0)) revert InvalidAddress();
        if (_operators.length == 0) revert InvalidAddress();

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

        // 5. Grant cross-contract permissions (internal roles)
        TipERC20(tipToken).grantRole(TipERC20(tipToken).MINTER(), tipAction);
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_MANAGER(), slashTip); // SlashTip needs to call subUserAllowance
        ERC20MintAction(tipAction).grantRole(ERC20MintAction(tipAction).EXECUTOR(), slashTip);

        // 6. Grant admin roles to _admin
        UserRegistry(userRegistry).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        TipERC20(tipToken).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ERC20MintAction(tipAction).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        SlashTip(slashTip).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        SlashTip(slashTip).grantRole(SlashTip(slashTip).PAUSER(), _admin);

        // 7. Grant operational roles to each operator
        for (uint256 i = 0; i < _operators.length; i++) {
            if (_operators[i] == address(0)) revert InvalidAddress();
            // UserRegistry roles
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).USER_MANAGER(), _operators[i]);
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_MANAGER(), _operators[i]);
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_ADMIN(), _operators[i]);
            // Action roles
            ERC20MintAction(tipAction).grantRole(ERC20MintAction(tipAction).CONFIG_MANAGER(), _operators[i]);
            // SlashTip roles
            SlashTip(slashTip).grantRole(SlashTip(slashTip).TIPPER(), _operators[i]);
        }

        // 8. Renounce factory's admin roles
        UserRegistry(userRegistry).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        TipERC20(tipToken).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        ERC20MintAction(tipAction).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        SlashTip(slashTip).renounceRole(DEFAULT_ADMIN_ROLE, factory);

        emit OrgDeployed(_orgId, _orgId, _admin, slashTip, userRegistry, tipAction, tipToken);
    }

    /// @notice Deploy a SlashTip setup with an ERC20 vault (uses existing token)
    /// @param _orgId Unique organization identifier
    /// @param _admin Admin address for role management (gets DEFAULT_ADMIN_ROLE, PAUSER)
    /// @param _operators Operator addresses for daily operations (each gets operational roles)
    /// @param _vaultManager Address that can withdraw funds from the vault (gets VAULT_MANAGER)
    /// @param _token Address of the existing ERC20 token to use
    function deployWithERC20Vault(
        string calldata _orgId,
        address _admin,
        address[] calldata _operators,
        address _vaultManager,
        address _token
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (
            address slashTip,
            address userRegistry,
            address tipAction
        )
    {
        if (_admin == address(0)) revert InvalidAddress();
        if (_operators.length == 0) revert InvalidAddress();
        if (_vaultManager == address(0)) revert InvalidAddress();
        if (_token == address(0)) revert InvalidAddress();

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

        // 4. Grant cross-contract permissions (internal roles)
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_MANAGER(), slashTip); // SlashTip needs to call subUserAllowance
        ERC20VaultAction(tipAction).grantRole(ERC20VaultAction(tipAction).EXECUTOR(), slashTip);

        // 5. Grant admin roles to _admin, vault manager role to _vaultManager
        UserRegistry(userRegistry).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ERC20VaultAction(tipAction).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ERC20VaultAction(tipAction).grantRole(ERC20VaultAction(tipAction).VAULT_MANAGER(), _vaultManager);
        SlashTip(slashTip).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        SlashTip(slashTip).grantRole(SlashTip(slashTip).PAUSER(), _admin);

        // 6. Grant operational roles to each operator
        for (uint256 i = 0; i < _operators.length; i++) {
            if (_operators[i] == address(0)) revert InvalidAddress();
            // UserRegistry roles
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).USER_MANAGER(), _operators[i]);
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_MANAGER(), _operators[i]);
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_ADMIN(), _operators[i]);
            // SlashTip roles
            SlashTip(slashTip).grantRole(SlashTip(slashTip).TIPPER(), _operators[i]);
        }

        // 7. Renounce factory's admin roles
        UserRegistry(userRegistry).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        ERC20VaultAction(tipAction).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        SlashTip(slashTip).renounceRole(DEFAULT_ADMIN_ROLE, factory);

        emit OrgDeployed(_orgId, _orgId, _admin, slashTip, userRegistry, tipAction, _token);
    }

    /// @notice Deploy a SlashTip setup with a native ETH vault
    /// @param _orgId Unique organization identifier
    /// @param _admin Admin address for role management (gets DEFAULT_ADMIN_ROLE, PAUSER)
    /// @param _operators Operator addresses for daily operations (each gets operational roles)
    /// @param _vaultManager Address that can withdraw funds from the vault (gets VAULT_MANAGER)
    function deployWithETHVault(
        string calldata _orgId,
        address _admin,
        address[] calldata _operators,
        address _vaultManager
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (
            address slashTip,
            address userRegistry,
            address tipAction
        )
    {
        if (_admin == address(0)) revert InvalidAddress();
        if (_operators.length == 0) revert InvalidAddress();
        if (_vaultManager == address(0)) revert InvalidAddress();

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

        // 4. Grant cross-contract permissions (internal roles)
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_MANAGER(), slashTip); // SlashTip needs to call subUserAllowance
        ETHVaultAction(payable(tipAction)).grantRole(ETHVaultAction(payable(tipAction)).EXECUTOR(), slashTip);

        // 5. Grant admin roles to _admin, vault manager role to _vaultManager
        UserRegistry(userRegistry).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ETHVaultAction(payable(tipAction)).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ETHVaultAction(payable(tipAction)).grantRole(ETHVaultAction(payable(tipAction)).VAULT_MANAGER(), _vaultManager);
        SlashTip(slashTip).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        SlashTip(slashTip).grantRole(SlashTip(slashTip).PAUSER(), _admin);

        // 6. Grant operational roles to each operator
        for (uint256 i = 0; i < _operators.length; i++) {
            if (_operators[i] == address(0)) revert InvalidAddress();
            // UserRegistry roles
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).USER_MANAGER(), _operators[i]);
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_MANAGER(), _operators[i]);
            UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).ALLOWANCE_ADMIN(), _operators[i]);
            // SlashTip roles
            SlashTip(slashTip).grantRole(SlashTip(slashTip).TIPPER(), _operators[i]);
        }

        // 7. Renounce factory's admin roles
        UserRegistry(userRegistry).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        ETHVaultAction(payable(tipAction)).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        SlashTip(slashTip).renounceRole(DEFAULT_ADMIN_ROLE, factory);

        emit OrgDeployed(_orgId, _orgId, _admin, slashTip, userRegistry, tipAction, address(0));
    }

    // ============ Tip Action Update Functions ============

    /// @notice Create a new ERC1155 tip action
    /// @dev After calling this, org admin must call slashTip.setTipAction(tipAction)
    /// @param _slashTip The SlashTip contract to grant EXECUTOR role to
    /// @param _admin Admin address for role management (gets DEFAULT_ADMIN_ROLE)
    /// @param _operators Operator addresses for daily operations (each gets operational roles)
    /// @param _tokenBaseURI Base URI for token metadata
    /// @param _contractURI Contract-level metadata URI
    /// @param _tokenId The token ID to use for tips
    function createERC1155Action(
        address _slashTip,
        address _admin,
        address[] calldata _operators,
        string calldata _tokenBaseURI,
        string calldata _contractURI,
        uint256 _tokenId
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (address tipAction, address tipToken)
    {
        if (_slashTip == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_operators.length == 0) revert InvalidAddress();

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

        // 3. Grant cross-contract permissions (internal roles)
        TipERC1155(tipToken).grantRole(TipERC1155(tipToken).MINTER(), tipAction);
        ERC1155MintAction(tipAction).grantRole(ERC1155MintAction(tipAction).EXECUTOR(), _slashTip);

        // 4. Grant admin roles to _admin
        TipERC1155(tipToken).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ERC1155MintAction(tipAction).grantRole(DEFAULT_ADMIN_ROLE, _admin);

        // 5. Grant operational roles to each operator
        for (uint256 i = 0; i < _operators.length; i++) {
            if (_operators[i] == address(0)) revert InvalidAddress();
            TipERC1155(tipToken).grantRole(TipERC1155(tipToken).METADATA_MANAGER(), _operators[i]);
            ERC1155MintAction(tipAction).grantRole(ERC1155MintAction(tipAction).CONFIG_MANAGER(), _operators[i]);
        }

        // 6. Renounce factory's admin roles
        TipERC1155(tipToken).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        ERC1155MintAction(tipAction).renounceRole(DEFAULT_ADMIN_ROLE, factory);

        emit TipActionCreated(_slashTip, _admin, tipAction, tipToken);
    }

    /// @notice Create a new ERC20 tip action
    /// @dev After calling this, org admin must call slashTip.setTipAction(tipAction)
    /// @param _slashTip The SlashTip contract to grant EXECUTOR role to
    /// @param _admin Admin address for role management (gets DEFAULT_ADMIN_ROLE)
    /// @param _operators Operator addresses for daily operations (each gets operational roles)
    /// @param _tokenName Name for the ERC20 token
    /// @param _tokenSymbol Symbol for the ERC20 token
    /// @param _tokenDecimals Decimals for the ERC20 token
    function createERC20Action(
        address _slashTip,
        address _admin,
        address[] calldata _operators,
        string calldata _tokenName,
        string calldata _tokenSymbol,
        uint8 _tokenDecimals
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (address tipAction, address tipToken)
    {
        if (_slashTip == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_operators.length == 0) revert InvalidAddress();

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

        // 3. Grant cross-contract permissions (internal roles)
        TipERC20(tipToken).grantRole(TipERC20(tipToken).MINTER(), tipAction);
        ERC20MintAction(tipAction).grantRole(ERC20MintAction(tipAction).EXECUTOR(), _slashTip);

        // 4. Grant admin roles to _admin
        TipERC20(tipToken).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ERC20MintAction(tipAction).grantRole(DEFAULT_ADMIN_ROLE, _admin);

        // 5. Grant operational roles to each operator
        for (uint256 i = 0; i < _operators.length; i++) {
            if (_operators[i] == address(0)) revert InvalidAddress();
            ERC20MintAction(tipAction).grantRole(ERC20MintAction(tipAction).CONFIG_MANAGER(), _operators[i]);
        }

        // 6. Renounce factory's admin roles
        TipERC20(tipToken).renounceRole(DEFAULT_ADMIN_ROLE, factory);
        ERC20MintAction(tipAction).renounceRole(DEFAULT_ADMIN_ROLE, factory);

        emit TipActionCreated(_slashTip, _admin, tipAction, tipToken);
    }

    /// @notice Create a new ERC20 vault tip action
    /// @dev After calling this, org admin must call slashTip.setTipAction(tipAction)
    /// @param _slashTip The SlashTip contract to grant EXECUTOR role to
    /// @param _admin Admin address for the new contracts
    /// @param _vaultManager Address that can withdraw funds from the vault
    /// @param _token Address of the existing ERC20 token to use
    function createERC20VaultAction(
        address _slashTip,
        address _admin,
        address _vaultManager,
        address _token
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (address tipAction)
    {
        if (_slashTip == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_vaultManager == address(0)) revert InvalidAddress();
        if (_token == address(0)) revert InvalidAddress();

        address factory = address(this);

        // 1. Deploy ERC20VaultAction proxy
        tipAction = address(new BeaconProxy(
            address(erc20VaultActionBeacon),
            abi.encodeCall(ERC20VaultAction.initialize, (factory, _token))
        ));

        // 2. Grant EXECUTOR to SlashTip
        ERC20VaultAction(tipAction).grantRole(ERC20VaultAction(tipAction).EXECUTOR(), _slashTip);

        // 3. Transfer roles - admin for management, vaultManager for withdrawals
        ERC20VaultAction(tipAction).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ERC20VaultAction(tipAction).grantRole(ERC20VaultAction(tipAction).VAULT_MANAGER(), _vaultManager);

        // 4. Renounce factory roles
        ERC20VaultAction(tipAction).renounceRole(DEFAULT_ADMIN_ROLE, factory);

        emit TipActionCreated(_slashTip, _admin, tipAction, _token);
    }

    /// @notice Create a new ETH vault tip action
    /// @dev After calling this, org admin must call slashTip.setTipAction(tipAction)
    /// @param _slashTip The SlashTip contract to grant EXECUTOR role to
    /// @param _admin Admin address for the new contract
    /// @param _vaultManager Address that can withdraw funds from the vault
    function createETHVaultAction(
        address _slashTip,
        address _admin,
        address _vaultManager
    )
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (address tipAction)
    {
        if (_slashTip == address(0)) revert InvalidAddress();
        if (_admin == address(0)) revert InvalidAddress();
        if (_vaultManager == address(0)) revert InvalidAddress();

        address factory = address(this);

        // 1. Deploy ETHVaultAction proxy
        tipAction = address(new BeaconProxy(
            address(ethVaultActionBeacon),
            abi.encodeCall(ETHVaultAction.initialize, (factory))
        ));

        // 2. Grant EXECUTOR to SlashTip
        ETHVaultAction(payable(tipAction)).grantRole(ETHVaultAction(payable(tipAction)).EXECUTOR(), _slashTip);

        // 3. Transfer roles - admin for management, vaultManager for withdrawals
        ETHVaultAction(payable(tipAction)).grantRole(DEFAULT_ADMIN_ROLE, _admin);
        ETHVaultAction(payable(tipAction)).grantRole(ETHVaultAction(payable(tipAction)).VAULT_MANAGER(), _vaultManager);

        // 4. Renounce factory roles
        ETHVaultAction(payable(tipAction)).renounceRole(DEFAULT_ADMIN_ROLE, factory);

        emit TipActionCreated(_slashTip, _admin, tipAction, address(0));
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
