# @slash-tip/chain

Solidity smart contracts for the /tip protocol. Includes ERC20/ERC1155 tip tokens, user registry, vault actions, and a factory contract for multi-tenant deployments.

## Architecture

The V2 contracts use the **Beacon Proxy pattern** for upgradeability:

- **Implementations** - Template contracts deployed once
- **Beacons** - Point to implementations, owned by factory
- **Proxies** - Lightweight per-org instances that delegate to beacons

This allows upgrading all organizations simultaneously by updating a beacon.

## Contracts

| Contract | Description |
|----------|-------------|
| `SlashTip` | Orchestrates tipping, validates allowances, executes actions |
| `UserRegistry` | Maps Slack IDs to wallet addresses, manages allowances |
| `TipERC1155` | ERC1155 token for NFT-style tips |
| `TipERC20` | ERC20 token for fungible tips |
| `ERC1155MintAction` | Mints ERC1155 tokens on tip |
| `ERC20MintAction` | Mints ERC20 tokens on tip |
| `ERC20VaultAction` | Transfers existing ERC20 from vault on tip |
| `ETHVaultAction` | Transfers native ETH from vault on tip |
| `SlashTipFactory` | Deploys org instances, manages beacons & upgrades |

## Access Control

All contracts use OpenZeppelin's `AccessControl` for role-based permissions. Roles are designed following the principle of least privilege.

### Role Categories

| Category | Purpose |
|----------|---------|
| **Internal Roles** | Cross-contract communication (granted to contracts only) |
| **Operational Roles** | Day-to-day operations (granted to backend services) |
| **Management Roles** | Periodic/sensitive operations (granted to trusted operators) |
| **Admin Roles** | Full control and emergency actions (granted to multisig) |

### Roles by Contract

#### SlashTip

| Role | Purpose |
|------|---------|
| `DEFAULT_ADMIN_ROLE` | Full control, can change tip action and registry |
| `PAUSER` | Emergency pause/unpause (protects against exploits) |
| `TIPPER` | Execute tips (granted to backend service) |

#### UserRegistry

| Role | Purpose |
|------|---------|
| `DEFAULT_ADMIN_ROLE` | Full control, role management |
| `USER_MANAGER` | Add/remove users |
| `ALLOWANCE_MANAGER` | Set individual user allowances |
| `ALLOWANCE_ADMIN` | Bulk allowance operations (weekly resets) |

#### TipERC1155

| Role | Purpose |
|------|---------|
| `DEFAULT_ADMIN_ROLE` | Full control, role management |
| `MINTER` | Mint tokens (internal: granted to action contract) |
| `METADATA_MANAGER` | Update base URI and contract URI |

#### TipERC20

| Role | Purpose |
|------|---------|
| `DEFAULT_ADMIN_ROLE` | Full control, role management |
| `MINTER` | Mint/burn tokens (internal: granted to action contract) |

#### Action Contracts (ERC1155MintAction, ERC20MintAction)

| Role | Purpose |
|------|---------|
| `DEFAULT_ADMIN_ROLE` | Full control, role management |
| `EXECUTOR` | Execute tip action (internal: granted to SlashTip) |
| `CONFIG_MANAGER` | Update token configuration |

#### Vault Contracts (ERC20VaultAction, ETHVaultAction)

| Role | Purpose |
|------|---------|
| `DEFAULT_ADMIN_ROLE` | Full control, role management |
| `EXECUTOR` | Execute tip action (internal: granted to SlashTip) |
| `VAULT_MANAGER` | Withdraw funds, rescue tokens |

### Typical Deployment Configuration

```
Org Admin (Multisig)
├── DEFAULT_ADMIN_ROLE on all contracts
└── PAUSER on SlashTip

Backend Service (Hot wallet)
├── TIPPER on SlashTip
├── USER_MANAGER on UserRegistry
└── ALLOWANCE_MANAGER on UserRegistry

Cron Service (Separate key)
└── ALLOWANCE_ADMIN on UserRegistry

Treasury (Multisig)
└── VAULT_MANAGER on vault actions

SlashTip Contract (Internal)
├── EXECUTOR on tip action
└── ALLOWANCE_MANAGER on UserRegistry
```

## Deployed Addresses (Base Mainnet)

**Admin:** `0xE7129298AE18FD2f4862E9a25D40CE333b11c583`

### Factory

| Contract | Address |
|----------|---------|
| SlashTipFactory | `0xf9E749524902a90BFF13ceEde494C60b7658cb4A` |

### Implementations

| Contract | Address |
|----------|---------|
| SlashTip | `0x20951a1BF3dC958F78912D72D0919DdaD11A8b5d` |
| UserRegistry | `0xD9A1843BcF0D6283b1f8e213Eb3baecFC79914f4` |
| TipERC1155 | `0x3c64970A0ADDFa2F29a717bd2c8e11452654F725` |
| TipERC20 | `0x4fE83003fA7b5967b69FAFc96124885b4477E830` |
| ERC1155MintAction | `0x812341337c3a8D5cF04DA58970fFbABBea1b182e` |
| ERC20MintAction | `0xD96f1C315Daa52C15F9494159ac02F1820e4fA69` |
| ERC20VaultAction | `0xe1A481e129d6aA7562b89452C75C84439d5b535F` |
| ETHVaultAction | `0x4f5422Ab6151bA60593F38505ee95a01343F7E48` |

> **Note:** These addresses will be updated after redeployment with the new role structure.

## Security Features

- **Pausability**: SlashTip can be paused in emergencies
- **Reentrancy Protection**: Vault actions use OpenZeppelin's ReentrancyGuard
- **Role Separation**: Operational roles are separated from admin roles
- **Upgradeable**: Beacon proxy pattern allows safe upgrades

## Development

```bash
# Build
forge build

# Test
forge test

# Test with verbosity
forge test -vvv

# Check sizes
forge build --sizes

# Lint
forge fmt --check

# Deploy factory
forge script script/DeployFactory.s.sol --rpc-url base --broadcast --verify
```
