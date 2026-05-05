use cardano/transaction.{Transaction, OutputReference}
use aiken/collection/list
use toro/types.{TraceDatum, StationAction}

/// Station spending validator.
/// Holds a CIP-68 reference token for a single batch and allows:
///   1. Tracing updates (signed by station).
///   2. Handover to merger (signed by station).
validator toro_station_signer(station_pkh: ByteArray, _merger_pkh: ByteArray) {
  spend(datum: Option<TraceDatum>, redeemer: StationAction, _utxo: OutputReference, self: Transaction) {
    expect Some(current) = datum

    when redeemer is {
      StationAction.UpdateTrace { new_timestamp, .. } -> {
        let signed = list.has(self.extra_signatories, station_pkh)
        // Mock: timestamp must advance.
        // TODO: verify continuing output holds the ref token with updated datum.
        signed && new_timestamp > current.timestamp
      }
      StationAction.HandoverToMerger -> {
        let signed = list.has(self.extra_signatories, station_pkh)
        // Mock: station approves handover to merger.
        // TODO: verify ref token is sent to merger address.
        signed
      }
    }
  }
}
