use anchor_lang::prelude::*;

#[account]
pub struct AdminConfig {
    pub signers: [Pubkey; 3],         // 3 admin keys
    pub min_signatures: u8,           // 2-of-3 required
    pub platform_fee_account: Pubkey, // Treasury account
    pub nonce: u8,
}

impl AdminConfig {
    pub const SIZE: usize = (32 * 3) + 1 + 32 + 1;
}

#[derive(Accounts)]
pub struct InitializeAdmin<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = AdminConfig::SIZE,
        seeds = [b"admin_config"],
        bump
    )]
    pub admin_config: Account<'info, AdminConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EmergencyAction<'info> {
    #[account(mut)]
    pub admin_config: Account<'info, AdminConfig>,

    #[account(
        constraint = admin_config.signers.contains(&signer_1.key()),
    )]
    pub signer_1: Signer<'info>,

    #[account(
        constraint = admin_config.signers.contains(&signer_2.key()),
    )]
    pub signer_2: Signer<'info>,

    // Target account for emergency action
    /// CHECK: Validated in handler
    #[account(mut)]
    pub target_account: AccountInfo<'info>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum EmergencyActionType {
    PauseMatches,
    UnpauseMatches,
    RecoverStuckFunds,
    UpdatePlatformFee,
}

// Error codes specific to admin actions
#[error_code]
pub enum AdminError {
    #[msg("Invalid admin signature")]
    InvalidAdminSignature,
    #[msg("Not enough admin signatures")]
    NotEnoughSignatures,
    #[msg("Invalid emergency action")]
    InvalidEmergencyAction,
} 