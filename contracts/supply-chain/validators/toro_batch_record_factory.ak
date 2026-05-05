use cardano/transaction.{Transaction}
use cardano/assets.{PolicyId, quantity_of}
use aiken/collection/list
use aiken/primitive/bytearray
use toro/types.{FactoryAction, ref_prefix}

/// Factory minting policy.
/// Mints a CIP-68 reference token for a new tuna batch.
validator toro_batch_record_factory(authorized_pkh: ByteArray) {
  mint(redeemer: FactoryAction, policy_id: PolicyId, self: Transaction) {
    let signed = list.has(self.extra_signatories, authorized_pkh)

    let FactoryAction.CreateBatch { batch_id } = redeemer
    let ref_name = bytearray.concat(ref_prefix, batch_id)
    // Mock: ensure exactly 1 ref token minted and caller is authorized.
    // TODO: verify ref token is sent to a station address with valid TraceDatum.
    signed && quantity_of(self.mint, policy_id, ref_name) == 1
  }
}
