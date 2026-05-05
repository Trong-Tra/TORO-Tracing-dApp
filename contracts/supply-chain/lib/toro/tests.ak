use toro/types.{
  TraceDatum, FinalProductDatum, FactoryAction, StationAction, MergerAction,
}

test trace_datum_creation() {
  let datum = TraceDatum {
    batch_id: "BATCH-001",
    product_name: "Bluefin Tuna",
    stage: "eggs",
    station_id: "STATION-A",
    timestamp: 1715000000,
    signer_pkh: "station_a_pkh",
  }
  datum.batch_id == "BATCH-001"
}

test final_product_datum() {
  let datum = FinalProductDatum {
    batch_ids: ["BATCH-001", "BATCH-002"],
    can_count: 500,
    timestamp: 1715000100,
  }
  datum.can_count == 500
}

test factory_action_create_batch() {
  let FactoryAction.CreateBatch { batch_id } = FactoryAction.CreateBatch { batch_id: "BATCH-003" }
  batch_id == "BATCH-003"
}

test station_action_update_trace() {
  let action = StationAction.UpdateTrace { new_stage: "hatching", new_timestamp: 1715000001 }
  when action is {
    StationAction.UpdateTrace { new_timestamp, .. } -> new_timestamp > 1715000000
    _ -> False
  }
}

test station_action_handover() {
  let action = StationAction.HandoverToMerger
  action == StationAction.HandoverToMerger
}

test merger_action_finalize() {
  let MergerAction.Finalize { can_count } = MergerAction.Finalize { can_count: 250 }
  can_count > 0
}
