// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {AccessControl} from "openzeppelin/access/AccessControl.sol";
import {UserRegistry} from "./UserRegistry.sol";
import {SlashTip} from "./SlashTip.sol";
import {TipERC1155} from "./TipERC1155.sol";
import {TipERC20} from "./TipERC20.sol";
import {ERC1155MintAction} from "./ERC1155MintAction.sol";
import {ERC20MintAction} from "./ERC20MintAction.sol";
import {ERC20VaultAction} from "./ERC20VaultAction.sol";
import {ITipAction} from "./ITipAction.sol";

/// @title SlashTipFactory
/// @notice Factory contract for deploying SlashTip instances for organizations
contract SlashTipFactory is AccessControl {
    bytes32 public constant FACTORY_MANAGER = keccak256("FACTORY_MANAGER");

    struct OrgDeployment {
        address slashTip;
        address userRegistry;
        address tipAction;
        address tipToken; // address(0) if using custom action
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

    error OrgAlreadyExists(string orgId);
    error OrgNotFound(string orgId);

    constructor(address _admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(FACTORY_MANAGER, _admin);
    }

    /// @notice Deploy a full SlashTip setup with a new ERC1155 token
    /// @param _orgId Unique organization identifier
    /// @param _admin Admin address for the deployed contracts
    /// @param _tokenBaseURI Base URI for token metadata
    /// @param _contractURI Contract-level metadata URI
    /// @param _tokenId The token ID to use for tips
    /// @return slashTip The deployed SlashTip contract address
    /// @return userRegistry The deployed UserRegistry contract address
    /// @return tipAction The deployed ERC1155MintAction contract address
    /// @return tipToken The deployed TipERC1155 contract address
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

        // 1. Deploy UserRegistry
        userRegistry = address(new UserRegistry(address(this), _orgId));

        // 2. Deploy TipERC1155 token
        tipToken = address(new TipERC1155(address(this), _tokenBaseURI, _contractURI));

        // 3. Deploy ERC1155MintAction
        tipAction = address(new ERC1155MintAction(address(this), tipToken, _tokenId));

        // 4. Deploy SlashTip
        slashTip = address(new SlashTip(address(this), userRegistry, tipAction, _orgId));

        // 5. Grant permissions
        // TipAction needs TIP_MINTER role on Tip token
        TipERC1155(tipToken).grantRole(TipERC1155(tipToken).TIP_MINTER(), tipAction);

        // SlashTip needs REGISTRY_MANAGER role on UserRegistry
        UserRegistry(userRegistry).grantRole(
            UserRegistry(userRegistry).REGISTRY_MANAGER(),
            slashTip
        );

        // 6. Transfer admin roles to the specified admin
        _transferERC1155AdminRoles(slashTip, userRegistry, tipAction, tipToken, _admin);

        // 7. Store deployment info
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
    /// @return slashTip The deployed SlashTip contract address
    /// @return userRegistry The deployed UserRegistry contract address
    /// @return tipAction The deployed ERC20MintAction contract address
    /// @return tipToken The deployed TipERC20 contract address
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

        // 1. Deploy UserRegistry
        userRegistry = address(new UserRegistry(address(this), _orgId));

        // 2. Deploy TipERC20 token
        tipToken = address(new TipERC20(address(this), _tokenName, _tokenSymbol, _tokenDecimals));

        // 3. Deploy ERC20MintAction
        tipAction = address(new ERC20MintAction(address(this), tipToken));

        // 4. Deploy SlashTip
        slashTip = address(new SlashTip(address(this), userRegistry, tipAction, _orgId));

        // 5. Grant permissions
        // TipAction needs TIP_MINTER role on Tip token
        TipERC20(tipToken).grantRole(TipERC20(tipToken).TIP_MINTER(), tipAction);

        // SlashTip needs REGISTRY_MANAGER role on UserRegistry
        UserRegistry(userRegistry).grantRole(
            UserRegistry(userRegistry).REGISTRY_MANAGER(),
            slashTip
        );

        // 6. Transfer admin roles to the specified admin
        _transferERC20AdminRoles(slashTip, userRegistry, tipAction, tipToken, _admin);

        // 7. Store deployment info
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
    /// @return slashTip The deployed SlashTip contract address
    /// @return userRegistry The deployed UserRegistry contract address
    /// @return tipAction The deployed ERC20VaultAction contract address
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

        // 1. Deploy UserRegistry
        userRegistry = address(new UserRegistry(address(this), _orgId));

        // 2. Deploy ERC20VaultAction (uses existing token)
        tipAction = address(new ERC20VaultAction(address(this), _token));

        // 3. Deploy SlashTip
        slashTip = address(new SlashTip(address(this), userRegistry, tipAction, _orgId));

        // 4. Grant permissions
        // SlashTip needs REGISTRY_MANAGER role on UserRegistry
        UserRegistry(userRegistry).grantRole(
            UserRegistry(userRegistry).REGISTRY_MANAGER(),
            slashTip
        );

        // 5. Transfer admin roles to the specified admin
        _transferERC20VaultAdminRoles(slashTip, userRegistry, tipAction, _admin);

        // 6. Store deployment info (tipToken is the existing token address for reference)
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

    /// @notice Deploy a SlashTip setup with a custom tip action (BYOC)
    /// @param _orgId Unique organization identifier
    /// @param _admin Admin address for the deployed contracts
    /// @param _customAction Address of the custom ITipAction contract
    /// @return slashTip The deployed SlashTip contract address
    /// @return userRegistry The deployed UserRegistry contract address
    function deployWithCustomAction(
        string calldata _orgId,
        address _admin,
        address _customAction
    )
        external
        onlyRole(FACTORY_MANAGER)
        returns (address slashTip, address userRegistry)
    {
        if (orgs[_orgId].exists) revert OrgAlreadyExists(_orgId);

        // 1. Deploy UserRegistry
        userRegistry = address(new UserRegistry(address(this), _orgId));

        // 2. Deploy SlashTip with custom action
        slashTip = address(new SlashTip(address(this), userRegistry, _customAction, _orgId));

        // 3. Grant permissions
        // SlashTip needs REGISTRY_MANAGER role on UserRegistry
        UserRegistry(userRegistry).grantRole(
            UserRegistry(userRegistry).REGISTRY_MANAGER(),
            slashTip
        );

        // 4. Transfer admin roles to the specified admin
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).DEFAULT_ADMIN_ROLE(), _admin);
        UserRegistry(userRegistry).grantRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), _admin);
        UserRegistry(userRegistry).renounceRole(UserRegistry(userRegistry).DEFAULT_ADMIN_ROLE(), address(this));
        UserRegistry(userRegistry).renounceRole(UserRegistry(userRegistry).REGISTRY_MANAGER(), address(this));

        SlashTip(slashTip).grantRole(SlashTip(slashTip).DEFAULT_ADMIN_ROLE(), _admin);
        SlashTip(slashTip).grantRole(SlashTip(slashTip).TIP_MANAGER(), _admin);
        SlashTip(slashTip).renounceRole(SlashTip(slashTip).DEFAULT_ADMIN_ROLE(), address(this));
        SlashTip(slashTip).renounceRole(SlashTip(slashTip).TIP_MANAGER(), address(this));

        // 5. Store deployment info
        orgs[_orgId] = OrgDeployment({
            slashTip: slashTip,
            userRegistry: userRegistry,
            tipAction: _customAction,
            tipToken: address(0),
            exists: true
        });
        orgIds.push(_orgId);

        emit OrgDeployed(_orgId, _admin, slashTip, userRegistry, _customAction, address(0));
    }

    /// @notice Get deployment info for an organization
    /// @param _orgId The organization ID
    /// @return The deployment info
    function getOrg(string calldata _orgId) external view returns (OrgDeployment memory) {
        if (!orgs[_orgId].exists) revert OrgNotFound(_orgId);
        return orgs[_orgId];
    }

    /// @notice Check if an organization exists
    /// @param _orgId The organization ID
    /// @return True if the organization exists
    function orgExists(string calldata _orgId) external view returns (bool) {
        return orgs[_orgId].exists;
    }

    /// @notice Get the total number of deployed organizations
    /// @return The number of organizations
    function orgCount() external view returns (uint256) {
        return orgIds.length;
    }

    /// @notice Get all organization IDs
    /// @return Array of organization IDs
    function listOrgIds() external view returns (string[] memory) {
        return orgIds;
    }

    /// @dev Transfer admin roles from factory to specified admin (ERC1155 deployment)
    function _transferERC1155AdminRoles(
        address _slashTip,
        address _userRegistry,
        address _tipAction,
        address _tipToken,
        address _admin
    ) internal {
        _transferCoreAdminRoles(_slashTip, _userRegistry, _admin);

        // ERC1155MintAction
        ERC1155MintAction(_tipAction).grantRole(ERC1155MintAction(_tipAction).DEFAULT_ADMIN_ROLE(), _admin);
        ERC1155MintAction(_tipAction).grantRole(ERC1155MintAction(_tipAction).ACTION_MANAGER(), _admin);
        ERC1155MintAction(_tipAction).renounceRole(ERC1155MintAction(_tipAction).DEFAULT_ADMIN_ROLE(), address(this));
        ERC1155MintAction(_tipAction).renounceRole(ERC1155MintAction(_tipAction).ACTION_MANAGER(), address(this));

        // TipERC1155 token
        TipERC1155(_tipToken).grantRole(TipERC1155(_tipToken).DEFAULT_ADMIN_ROLE(), _admin);
        TipERC1155(_tipToken).grantRole(TipERC1155(_tipToken).TIP_MINTER(), _admin);
        TipERC1155(_tipToken).renounceRole(TipERC1155(_tipToken).DEFAULT_ADMIN_ROLE(), address(this));
        TipERC1155(_tipToken).renounceRole(TipERC1155(_tipToken).TIP_MINTER(), address(this));
    }

    /// @dev Transfer admin roles from factory to specified admin (ERC20 deployment)
    function _transferERC20AdminRoles(
        address _slashTip,
        address _userRegistry,
        address _tipAction,
        address _tipToken,
        address _admin
    ) internal {
        _transferCoreAdminRoles(_slashTip, _userRegistry, _admin);

        // ERC20MintAction
        ERC20MintAction(_tipAction).grantRole(ERC20MintAction(_tipAction).DEFAULT_ADMIN_ROLE(), _admin);
        ERC20MintAction(_tipAction).grantRole(ERC20MintAction(_tipAction).ACTION_MANAGER(), _admin);
        ERC20MintAction(_tipAction).renounceRole(ERC20MintAction(_tipAction).DEFAULT_ADMIN_ROLE(), address(this));
        ERC20MintAction(_tipAction).renounceRole(ERC20MintAction(_tipAction).ACTION_MANAGER(), address(this));

        // TipERC20 token
        TipERC20(_tipToken).grantRole(TipERC20(_tipToken).DEFAULT_ADMIN_ROLE(), _admin);
        TipERC20(_tipToken).grantRole(TipERC20(_tipToken).TIP_MINTER(), _admin);
        TipERC20(_tipToken).renounceRole(TipERC20(_tipToken).DEFAULT_ADMIN_ROLE(), address(this));
        TipERC20(_tipToken).renounceRole(TipERC20(_tipToken).TIP_MINTER(), address(this));
    }

    /// @dev Transfer admin roles from factory to specified admin (ERC20 vault deployment)
    function _transferERC20VaultAdminRoles(
        address _slashTip,
        address _userRegistry,
        address _tipAction,
        address _admin
    ) internal {
        _transferCoreAdminRoles(_slashTip, _userRegistry, _admin);

        // ERC20VaultAction
        ERC20VaultAction(_tipAction).grantRole(ERC20VaultAction(_tipAction).DEFAULT_ADMIN_ROLE(), _admin);
        ERC20VaultAction(_tipAction).grantRole(ERC20VaultAction(_tipAction).VAULT_MANAGER(), _admin);
        ERC20VaultAction(_tipAction).renounceRole(ERC20VaultAction(_tipAction).DEFAULT_ADMIN_ROLE(), address(this));
        ERC20VaultAction(_tipAction).renounceRole(ERC20VaultAction(_tipAction).VAULT_MANAGER(), address(this));
    }

    /// @dev Transfer core admin roles (UserRegistry + SlashTip)
    function _transferCoreAdminRoles(
        address _slashTip,
        address _userRegistry,
        address _admin
    ) internal {
        // UserRegistry
        UserRegistry(_userRegistry).grantRole(UserRegistry(_userRegistry).DEFAULT_ADMIN_ROLE(), _admin);
        UserRegistry(_userRegistry).grantRole(UserRegistry(_userRegistry).REGISTRY_MANAGER(), _admin);
        UserRegistry(_userRegistry).renounceRole(UserRegistry(_userRegistry).DEFAULT_ADMIN_ROLE(), address(this));
        UserRegistry(_userRegistry).renounceRole(UserRegistry(_userRegistry).REGISTRY_MANAGER(), address(this));

        // SlashTip
        SlashTip(_slashTip).grantRole(SlashTip(_slashTip).DEFAULT_ADMIN_ROLE(), _admin);
        SlashTip(_slashTip).grantRole(SlashTip(_slashTip).TIP_MANAGER(), _admin);
        SlashTip(_slashTip).renounceRole(SlashTip(_slashTip).DEFAULT_ADMIN_ROLE(), address(this));
        SlashTip(_slashTip).renounceRole(SlashTip(_slashTip).TIP_MANAGER(), address(this));
    }
}
