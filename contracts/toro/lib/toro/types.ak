//// CIP-68-based supply chain types for tuna tracing.

/// CIP-68 reference token prefix (4 bytes).
pub const ref_prefix = #"000643b0"

/// CIP-68 user token prefix (4 bytes).
pub const usr_prefix = #"000de140"

/// Datum stored with the CIP-68 reference token at each station.
pub type TraceDatum {
  batch_id: ByteArray,
  product_name: ByteArray,
  stage: ByteArray,
  station_id: ByteArray,
  timestamp: Int,
  /// TODO: upgrade to List<ByteArray> + min_signers for m-of-n multisig.
  signer_pkh: ByteArray,
}

/// Datum for the final canned product public UTxO.
pub type FinalProductDatum {
  batch_ids: List<ByteArray>,
  can_count: Int,
  timestamp: Int,
}

/// Factory minting redeemer.
pub type FactoryAction {
  CreateBatch { batch_id: ByteArray }
}

/// Station spending redeemer.
pub type StationAction {
  UpdateTrace { new_stage: ByteArray, new_timestamp: Int }
  HandoverToMerger
}

/// Merger spending redeemer.
pub type MergerAction {
  Finalize { can_count: Int }
}
