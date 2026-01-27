# Legacy Migration Guide: DeprecatedTip to V2 System

This guide documents the process for migrating an existing organization using the legacy `DeprecatedTip` ERC1155 contract to the new V2 system while preserving the original token and its balances.

## Overview

**Approach:** Deploy V2 contracts via factory, then use `setToken()` on the `ERC1155MintAction` to point to the original `DeprecatedTip` contract.

### Architecture

```
┌──────────────────┐
│ SlashTipFactory  │
└────────┬─────────┘
         │ deployWithERC1155()
         ▼
┌─────────────────┐
│    SlashTip     │
│ (beacon proxy)  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌────────────┐ ┌──────────────┐  setToken()  ┌─────────────────┐
│UserRegistry│ │ERC1155Mint   │─────────────▶│  DeprecatedTip  │
│  (used)    │ │   Action     │              │(existing ERC1155)│
└────────────┘ └──────────────┘              └─────────────────┘
                     │                              ▲
                     │ mint()                       │
                     └──────────────────────────────┘

               ┌──────────────┐
               │ TipERC1155   │  (unused - factory creates this)
               └──────────────┘
```

## Prerequisites

Before starting the migration, gather the following information:

| Item | Description | Example |
|------|-------------|---------|
| `FACTORY_ADDRESS` | SlashTipFactory contract address | `0x20ca42...` |
| `DEPRECATED_TIP_ADDRESS` | Existing DeprecatedTip contract | `0xabc123...` |
| `DEPRECATED_USER_REGISTRY_ADDRESS` | Existing DeprecatedUserRegistry | `0xdef456...` |
| `ORG_ID` | Organization ID from database | `T12345678` |
| `TOKEN_ID` | Token ID used for tips in DeprecatedTip | `0` |
| `ADMIN_ADDRESS` | Admin address for new contracts | `0x...` |
| `DEPLOYER_PRIVATE_KEY` | Key with DEPLOYER role on factory | - |
| `ADMIN_PRIVATE_KEY` | Key with DEFAULT_ADMIN_ROLE on DeprecatedTip | - |
| `OPERATOR_PRIVATE_KEY` | Key with USER_MANAGER role on new UserRegistry | - |

## Migration Steps

### Step 1: Deploy V2 Contracts via Factory

This deploys SlashTip, UserRegistry, TipERC1155 (unused), and ERC1155MintAction, then points the action to the existing DeprecatedTip.

```bash
# Set environment variables
export DEPLOYER_PRIVATE_KEY="0x..."
export FACTORY_ADDRESS="0x20ca42bEDE1a937F020d348eEd5939a8A953294c"
export DEPRECATED_TIP_ADDRESS="0x..."
export ORG_ID="T12345678"
export ADMIN_ADDRESS="0x..."
export TOKEN_ID="0"

# Run deployment
forge script script/DeployLegacyMigration.s.sol:DeployLegacyMigration \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify
```

**Output:** Note the deployed contract addresses:
- `SlashTip`
- `UserRegistry`
- `ERC1155MintAction` (TIP_ACTION_ADDRESS)
- `TipERC1155` (unused)

### Step 2: Grant TIP_MANAGER Role

The ERC1155MintAction needs the `TIP_MANAGER` role on DeprecatedTip to mint tokens.

```bash
# Set environment variables
export ADMIN_PRIVATE_KEY="0x..."  # Must have DEFAULT_ADMIN_ROLE on DeprecatedTip
export DEPRECATED_TIP_ADDRESS="0x..."
export TIP_ACTION_ADDRESS="0x..."  # From Step 1 output

# Run role grant
forge script script/DeployLegacyMigration.s.sol:GrantTipManager \
  --rpc-url $RPC_URL \
  --broadcast
```

### Step 3: Update Database

Update the `org_contracts` table to point to the DeprecatedTip contract:

```sql
UPDATE org_contracts
SET tip_token_address = '0x...DeprecatedTip'
WHERE org_id = 'T12345678';
```

### Step 4: Migrate Users

Copy users from DeprecatedUserRegistry to the new UserRegistry:

```bash
# Set environment variables
export OPERATOR_PRIVATE_KEY="0x..."  # Must have USER_MANAGER role
export DEPRECATED_USER_REGISTRY_ADDRESS="0x..."
export NEW_USER_REGISTRY_ADDRESS="0x..."  # From Step 1 output

# Run user migration
forge script script/DeployLegacyMigration.s.sol:MigrateUsers \
  --rpc-url $RPC_URL \
  --broadcast
```

### Step 5: Verify Migration

Run the verification script to confirm everything is configured correctly:

```bash
export USER_REGISTRY_ADDRESS="0x..."
export TIP_ACTION_ADDRESS="0x..."
export DEPRECATED_TIP_ADDRESS="0x..."

forge script script/DeployLegacyMigration.s.sol:VerifyMigration \
  --rpc-url $RPC_URL
```

Expected output should show:
- Action token pointing to DeprecatedTip: `true`
- Action has TIP_MANAGER role: `true`
- Status: `READY`

## Role Configuration

After migration, the role chain should be:

| Contract | Role | Granted To |
|----------|------|------------|
| SlashTip | TIPPER | Operator addresses (Syndicate relayers) |
| SlashTip | DEFAULT_ADMIN_ROLE | Admin address |
| UserRegistry | USER_MANAGER | Operator addresses |
| UserRegistry | ALLOWANCE_MANAGER | SlashTip + Operators |
| UserRegistry | ALLOWANCE_ADMIN | Operators |
| ERC1155MintAction | EXECUTOR | SlashTip |
| ERC1155MintAction | CONFIG_MANAGER | Admin address |
| **DeprecatedTip** | **TIP_MANAGER** | **ERC1155MintAction** |

The factory handles all roles automatically except the last one (TIP_MANAGER on DeprecatedTip).

## End-to-End Verification

After completing all steps, verify the full flow:

1. **Contract Configuration:**
   - `action.token()` returns DeprecatedTip address
   - `action.tokenId()` matches expected token ID
   - ERC1155MintAction has TIP_MANAGER on DeprecatedTip

2. **Indexer:**
   - Confirm `OrgDeployed` event was indexed
   - Verify `tip_token_address` updated in database
   - Verify `UserAdded` events indexed for migrated users

3. **Functional Test:**
   - Call `slashTip.tip()` through the backend
   - Verify token minted on DeprecatedTip (not TipERC1155)
   - Verify tip recorded in database via indexer

## Notes

- The factory creates an unused `TipERC1155` contract - this is expected and ignored
- Beacon upgrade benefits apply to SlashTip, UserRegistry, and ERC1155MintAction
- The `DeprecatedTip` contract is NOT upgradeable (original deployment)
- Default operators are the Syndicate relayer addresses

## Troubleshooting

### "AccessControl: account is missing role"

- **On factory deployment:** Ensure DEPLOYER_PRIVATE_KEY has DEPLOYER role on factory
- **On TIP_MANAGER grant:** Ensure ADMIN_PRIVATE_KEY has DEFAULT_ADMIN_ROLE on DeprecatedTip
- **On user migration:** Ensure OPERATOR_PRIVATE_KEY has USER_MANAGER role on new UserRegistry

### "User already exists"

The MigrateUsers script skips users that already exist in the new registry. This is expected if you're re-running the migration.

### Tips not minting

1. Verify action has TIP_MANAGER role on DeprecatedTip
2. Verify SlashTip has EXECUTOR role on ERC1155MintAction
3. Verify caller has TIPPER role on SlashTip

## Script Reference

All scripts are in `packages/chain/script/DeployLegacyMigration.s.sol`:

| Contract | Purpose |
|----------|---------|
| `DeployLegacyMigration` | Deploy V2 contracts and point to DeprecatedTip |
| `GrantTipManager` | Grant TIP_MANAGER role on DeprecatedTip |
| `MigrateUsers` | Copy users from old to new registry |
| `VerifyMigration` | Verify migration configuration |
