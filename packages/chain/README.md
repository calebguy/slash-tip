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

**Deployers (Syndicate relayers):**
- `0xE7129298AE18FD2f4862E9a25D40CE333b11c583`
- `0x8f9B71d1a895e4Fb4906D3e01F3B39FB983E33e0`
- `0xDd73C6Adea961820981b4e65b514F7D00A195c07`

### Factory

| Contract | Address |
|----------|---------|
| SlashTipFactory | `0x8a36142F7faC74C700C6Bd88152A16B1dC7811c7` |

### Implementations

| Contract | Address |
|----------|---------|
| SlashTip | `0xEa10ce33825c62834563ABdA7DD725607d08b0ee` |
| UserRegistry | `0x7abFF9a08D5A089D10edc83DB34aBa3b636aF180` |
| TipERC1155 | `0x9887Ac7aa36B8E10268ef1749afA7736F5B170AC` |
| TipERC20 | `0x99956DF088B58f3342C145F42B971af25acC93aE` |
| ERC1155MintAction | `0x079D8Ce4f52d0776f885a7907d9a091EcB67B539` |
| ERC20MintAction | `0x00Ad950ca103ba7462d1A786d5CB15E578BE82b7` |
| ERC20VaultAction | `0x8d008204b0dBAD0F20aee936DA3dD4ca4e07A5A2` |
| ETHVaultAction | `0x3bec59B4ac01271441B742b24EcB2331de32Dd3C` |

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
