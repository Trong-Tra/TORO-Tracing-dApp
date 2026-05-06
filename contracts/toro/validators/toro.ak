use cardano/transaction.{Transaction}
use cardano/assets.{PolicyId}

// CIP-68 prefixes
const ref_prefix = #"000643b0"
const usr_prefix = #"000de140"

// Permissive minting policy for the investor demo.
// In production, constrain by authorized signers and batch IDs.
validator toro {
  mint(_redeemer: Data, _policy_id: PolicyId, _self: Transaction) {
    True
  }
}
