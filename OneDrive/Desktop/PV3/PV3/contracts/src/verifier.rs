use anchor_lang::prelude::*;
use std::convert::TryInto;

#[account]
pub struct VerifierConfig {
    pub verifier_pubkey: Pubkey,      // Current verifier public key
    pub admin_config: Pubkey,         // Link to admin config for updates
    pub is_active: bool,              // Can be disabled by admin
    pub nonce: u8,
}

impl VerifierConfig {
    pub const SIZE: usize = 32 + 32 + 1 + 1;
}

#[derive(Accounts)]
pub struct InitializeVerifier<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = VerifierConfig::SIZE,
        seeds = [b"verifier_config"],
        bump
    )]
    pub verifier_config: Account<'info, VerifierConfig>,

    pub system_program: Program<'info, System>,
}

// Verify ed25519 program for signature verification
#[derive(Accounts)]
pub struct VerifySignature<'info> {
    /// CHECK: This is the Ed25519 program
    #[account(address = anchor_lang::solana_program::ed25519_program::ID)]
    pub ed25519_program: AccountInfo<'info>,
}

pub fn verify_signature(
    ctx: &Context<VerifySignature>,
    verifier_pubkey: [u8; 32],
    msg: &[u8],
    sig: [u8; 64],
) -> Result<bool> {
    let ix = anchor_lang::solana_program::ed25519_program::instruction::new_ed25519_instruction(
        &sig,
        &msg,
        &verifier_pubkey,
    );

    let account_infos = [ctx.accounts.ed25519_program.clone()];

    match anchor_lang::solana_program::program::invoke(&ix, &account_infos) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

// Helper function to create message for signature verification
pub fn create_result_message(
    match_pubkey: Pubkey,
    winner: Pubkey,
    timestamp: i64,
) -> Vec<u8> {
    let mut msg = Vec::new();
    msg.extend_from_slice(&match_pubkey.to_bytes());
    msg.extend_from_slice(&winner.to_bytes());
    msg.extend_from_slice(&timestamp.to_le_bytes());
    msg
}

#[error_code]
pub enum VerifierError {
    #[msg("Invalid verifier signature")]
    InvalidSignature,
    #[msg("Verifier is not active")]
    VerifierNotActive,
    #[msg("Invalid message format")]
    InvalidMessageFormat,
} 