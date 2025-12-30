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
| `SlashTipFactory` | Deploys org instances, manages beacons & upgrades |

## Deployed Addresses (Base Mainnet)

**Admin:** `0xE7129298AE18FD2f4862E9a25D40CE333b11c583`

### Factory

| Contract | Address |
|----------|---------|
| SlashTipFactory | `0x1b7f53A1f5D2951275b6e3E1cb6Ad06333c8459F` |

### Implementations

| Contract | Address |
|----------|---------|
| SlashTip | `0xAF9F2C21a085712535e28c070629382Ae4F31534` |
| UserRegistry | `0xB765639c781e92B20754E9ee9B749941A6d8d30f` |
| TipERC1155 | `0xFaed9eCde814329026dC6258674a98040A1e8903` |
| TipERC20 | `0xaCf41658F6Ca80021D64ff5044fC2A8F7543C1C3` |
| ERC1155MintAction | `0x57D46C53A522901235e9F59C44b38A79b7C883F8` |
| ERC20MintAction | `0xAC7F5dE17761e03D59D710b0396894f2eA2E7942` |
| ERC20VaultAction | `0x4FA419c7AfBD180D6aCC9E023Ea5bb6d5D7385A9` |

## Development

```bash
# Build
forge build

# Test
forge test

# Check sizes
forge build --sizes

# Lint
forge lint

# Deploy (see script/DeployV2.s.sol)
forge script script/DeployV2.s.sol:DeployV2 --rpc-url $BASE_RPC_URL --broadcast --verify
```
