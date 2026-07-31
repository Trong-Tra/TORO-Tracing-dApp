// PDA seed prefixes
pub const CONFIG_SEED: &[u8] = b"config";
pub const FACTORY_SEED: &[u8] = b"factory";
pub const STATION_SEED: &[u8] = b"station";
pub const BATCH_SEED: &[u8] = b"batch";
pub const LOT_SEED: &[u8] = b"lot";

// Batch lifecycle stages (1=Source, 2=Inventory, 3=Manufacturing)
pub const STAGE_SOURCE: u8 = 1;
pub const STAGE_INVENTORY: u8 = 2;
pub const STAGE_MANUFACTURING: u8 = 3;

// Lot lifecycle stages (3=Manufacturing, 4=Warehouse, 5=Distribution)
pub const STAGE_WAREHOUSE: u8 = 4;
pub const STAGE_DISTRIBUTION: u8 = 5;

// Max input batches per product lot
pub const MAX_LOT_INPUTS: usize = 16;
