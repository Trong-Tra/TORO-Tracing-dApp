// TORO — Traceable Supply Chain Datum Types
//
// Two independent trace chains converge at final product:
//   Station A (Farm):   Hatchery → Nursery → Growout → HarvestTransport → FarmProcessing
//   Station B (Catch):  CatchIce → PortLanding → TransportPlant → CatchProcessing
//   Final:              Product merge of both chains

// ---------------------------------------------------------------------------
// Station A — Farm
// ---------------------------------------------------------------------------

pub type HatcheryDatum {
    batch_id: ByteArray,
    egg_weight_kg: Int,
    hatchery_location: ByteArray,
    spawn_date: ByteArray,
    supplier_profile_hash: ByteArray,
}

pub type NurseryDatum {
    prev_tx: ByteArray,
    fry_weight_kg: Int,
    survival_rate_pct: Int,
    pond_id: ByteArray,
    feed_type_hash: ByteArray,
}

pub type GrowoutDatum {
    prev_tx: ByteArray,
    fish_weight_kg: Int,
    density_per_m3: Int,
    harvest_date: ByteArray,
    antibiotic_free_cert_hash: ByteArray,
}

pub type HarvestTransportDatum {
    prev_tx: ByteArray,
    shipped_weight_kg: Int,
    ice_temp_c: Int,
    truck_id: ByteArray,
    arrival_time: ByteArray,
}

pub type FarmProcessingDatum {
    prev_tx: ByteArray,
    input_weight_kg: Int,
    output_cans: Int,
    wastage_kg: Int,
    supervisor_id: ByteArray,
}

// ---------------------------------------------------------------------------
// Station B — Catch
// ---------------------------------------------------------------------------

pub type CatchIceDatum {
    batch_id: ByteArray,
    catch_weight_kg: Int,
    catch_location_latlon_hash: ByteArray,
    fishing_method: ByteArray,
    vessel_id: ByteArray,
    catch_date: ByteArray,
}

pub type PortLandingDatum {
    prev_tx: ByteArray,
    landed_weight_kg: Int,
    port_name: ByteArray,
    cold_storage_temp: Int,
    quality_cert_hash: ByteArray,
}

pub type TransportPlantDatum {
    prev_tx: ByteArray,
    shipped_weight_kg: Int,
    container_id: ByteArray,
    transit_time_hours: Int,
    storage_condition_hash: ByteArray,
}

pub type CatchProcessingDatum {
    prev_tx: ByteArray,
    input_weight_kg: Int,
    output_cans: Int,
    wastage_kg: Int,
    supervisor_id: ByteArray,
}

// ---------------------------------------------------------------------------
// Final Product
// ---------------------------------------------------------------------------

pub type FinalProductDatum {
    prev_tx_a: ByteArray,
    prev_tx_b: ByteArray,
    total_cans: Int,
    farm_cans: Int,
    catch_cans: Int,
    batch_label: ByteArray,
    packaging_date: ByteArray,
    distribution_center: ByteArray,
}

// ---------------------------------------------------------------------------
// Unified trace datum — union of all stage types
// ---------------------------------------------------------------------------

pub type TraceDatum {
    Hatchery { batch_id: ByteArray, egg_weight_kg: Int, hatchery_location: ByteArray, spawn_date: ByteArray, supplier_profile_hash: ByteArray }
    Nursery { prev_tx: ByteArray, fry_weight_kg: Int, survival_rate_pct: Int, pond_id: ByteArray, feed_type_hash: ByteArray }
    Growout { prev_tx: ByteArray, fish_weight_kg: Int, density_per_m3: Int, harvest_date: ByteArray, antibiotic_free_cert_hash: ByteArray }
    HarvestTransport { prev_tx: ByteArray, shipped_weight_kg: Int, ice_temp_c: Int, truck_id: ByteArray, arrival_time: ByteArray }
    FarmProcessing { prev_tx: ByteArray, input_weight_kg: Int, output_cans: Int, wastage_kg: Int, supervisor_id: ByteArray }
    CatchIce { batch_id: ByteArray, catch_weight_kg: Int, catch_location_latlon_hash: ByteArray, fishing_method: ByteArray, vessel_id: ByteArray, catch_date: ByteArray }
    PortLanding { prev_tx: ByteArray, landed_weight_kg: Int, port_name: ByteArray, cold_storage_temp: Int, quality_cert_hash: ByteArray }
    TransportPlant { prev_tx: ByteArray, shipped_weight_kg: Int, container_id: ByteArray, transit_time_hours: Int, storage_condition_hash: ByteArray }
    CatchProcessing { prev_tx: ByteArray, input_weight_kg: Int, output_cans: Int, wastage_kg: Int, supervisor_id: ByteArray }
    FinalProduct { prev_tx_a: ByteArray, prev_tx_b: ByteArray, total_cans: Int, farm_cans: Int, catch_cans: Int, batch_label: ByteArray, packaging_date: ByteArray, distribution_center: ByteArray }
}
