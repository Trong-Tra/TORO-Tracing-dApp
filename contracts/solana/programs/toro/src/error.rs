use anchor_lang::prelude::*;

#[error_code]
pub enum ToroError {
    #[msg("Unauthorized caller")]
    Unauthorized,

    #[msg("Invalid stage transition")]
    InvalidStage,

    #[msg("Batch is not at the manufacturing stage")]
    BatchNotAtManufacturing,

    #[msg("Lot must have at least one input batch")]
    NoInputs,

    #[msg("Too many input batches (max 16)")]
    TooManyInputs,

    #[msg("Invalid input batch account")]
    InvalidBatchAccount,
}
