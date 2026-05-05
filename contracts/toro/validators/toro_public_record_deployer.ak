use cardano/transaction.{Transaction, OutputReference}
use aiken/collection/list
use toro/types.{TraceDatum, MergerAction}

/// Merger spending validator.
/// Consumes batches handed over from stations and releases:
///   1. A single public UTxO with FinalProductDatum (can count).
///   2. Excess ADA returned to vault.
validator toro_public_record_deployer(merger_pkh: ByteArray, _vault_pkh: ByteArray) {
  spend(datum: Option<TraceDatum>, redeemer: MergerAction, _utxo: OutputReference, self: Transaction) {
    expect Some(_) = datum

    let MergerAction.Finalize { can_count } = redeemer
    let signed = list.has(self.extra_signatories, merger_pkh)
    // Mock: merger signs and declares can count.
    // TODO: verify exactly 1 output with FinalProductDatum containing all batch_ids.
    // TODO: verify excess ADA is sent to vault_pkh.
    signed && can_count > 0
  }
}
