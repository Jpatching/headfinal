// Admin module - placeholder for admin tools and governance
// Will be expanded with admin panel functionality, multisig controls, etc.

use anchor_lang::prelude::*;
use crate::{PlatformConfig, PV3Error, SessionVault};

#[derive(Accounts)]
pub struct InitializeAdmin<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(
        init,
        payer = payer,
        space = AdminConfig::SIZE,
        seeds = [b"admin"],
        bump
    )]
    pub admin_config: Account<'info, AdminConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EmergencyAction<'info> {
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin_signers.contains(&signer.key()) @ PV3Error::UnauthorizedAdmin
    )]
    pub config: Account<'info, PlatformConfig>,
    
    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecoverVault<'info> {
    #[account(
        mut,
        seeds = [b"session", vault_owner.key().as_ref()],
        bump = session_vault.bump
    )]
    pub session_vault: Account<'info, SessionVault>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin_signers.contains(&admin1.key()) @ PV3Error::UnauthorizedAdmin,
        constraint = config.admin_signers.contains(&admin2.key()) @ PV3Error::UnauthorizedAdmin,
        constraint = admin1.key() != admin2.key() @ PV3Error::InsufficientAdminSignatures
    )]
    pub config: Account<'info, PlatformConfig>,
    
    /// CHECK: The owner of the vault being recovered
    pub vault_owner: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Recovery destination (vault owner or treasury)
    pub recovery_destination: AccountInfo<'info>,
    
    // 2-of-3 multisig requirement
    pub admin1: Signer<'info>,
    pub admin2: Signer<'info>,
}

#[account]
pub struct AdminConfig {
    pub treasury: Pubkey,
    pub referral_pool: Pubkey,
    pub is_paused: bool,
    pub admin_authority: Pubkey,
}

impl AdminConfig {
    pub const SIZE: usize = 32 + 32 + 1 + 32 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum EmergencyActionType {
    PauseMatches,
    UnpauseMatches,
    RecoverStuckFunds,
    UpdatePlatformFee,
}

// Admin functions
pub fn emergency_pause(ctx: Context<EmergencyAction>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let admin = &ctx.accounts.signer;
    
    require!(!config.is_paused, PV3Error::PlatformPaused);
    
    config.is_paused = true;
    
    emit!(EmergencyPauseActivated {
        admin: admin.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    msg!("Emergency pause activated by admin: {}", admin.key());
    Ok(())
}

pub fn emergency_unpause(ctx: Context<EmergencyAction>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let admin = &ctx.accounts.signer;
    
    require!(config.is_paused, PV3Error::PlatformPaused);
    
    config.is_paused = false;
    
    emit!(EmergencyPauseDeactivated {
        admin: admin.key(),
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    msg!("Emergency pause deactivated by admin: {}", admin.key());
    Ok(())
}

pub fn update_fees(
    ctx: Context<EmergencyAction>,
    platform_fee_bps: u16,
    treasury_fee_bps: u16,
    referral_fee_bps: u16,
) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let admin = &ctx.accounts.signer;
    
    // Validate fee structure
    require!(
        platform_fee_bps <= 1000, // Max 10%
        PV3Error::InvalidAmount
    );
    require!(
        treasury_fee_bps + referral_fee_bps == platform_fee_bps,
        PV3Error::InvalidAmount
    );
    
    let old_platform_fee = config.platform_fee_bps;
    let old_treasury_fee = config.treasury_fee_bps;
    let old_referral_fee = config.referral_fee_bps;
    
    config.platform_fee_bps = platform_fee_bps;
    config.treasury_fee_bps = treasury_fee_bps;
    config.referral_fee_bps = referral_fee_bps;
    
    emit!(FeesUpdated {
        admin: admin.key(),
        old_platform_fee_bps: old_platform_fee,
        new_platform_fee_bps: platform_fee_bps,
        old_treasury_fee_bps: old_treasury_fee,
        new_treasury_fee_bps: treasury_fee_bps,
        old_referral_fee_bps: old_referral_fee,
        new_referral_fee_bps: referral_fee_bps,
        timestamp: Clock::get()?.unix_timestamp,
    });
    
    msg!(
        "Fees updated by admin: {} - Platform: {}bps, Treasury: {}bps, Referral: {}bps",
        admin.key(),
        platform_fee_bps,
        treasury_fee_bps,
        referral_fee_bps
    );
    
    Ok(())
}

pub fn recover_inactive_vault(
    ctx: Context<RecoverVault>,
    inactivity_threshold_hours: u64,
) -> Result<()> {
    let session_vault = &mut ctx.accounts.session_vault;
    let vault_owner = &ctx.accounts.vault_owner;
    let recovery_destination = &ctx.accounts.recovery_destination;
    let admin1 = &ctx.accounts.admin1;
    let admin2 = &ctx.accounts.admin2;
    
    let current_time = Clock::get()?.unix_timestamp;
    let threshold_seconds = inactivity_threshold_hours * 3600;
    let inactivity_duration = current_time - session_vault.last_activity;
    
    // Require minimum 48 hours of inactivity as per whitepaper
    require!(
        inactivity_threshold_hours >= 48,
        PV3Error::InvalidAmount
    );
    require!(
        inactivity_duration >= threshold_seconds as i64,
        PV3Error::InvalidAmount
    );
    require!(
        session_vault.balance > 0,
        PV3Error::InvalidAmount
    );
    
    let recovery_amount = session_vault.balance;
    
    // Transfer vault funds to recovery destination
    **session_vault.to_account_info().try_borrow_mut_lamports()? -= recovery_amount;
    **recovery_destination.to_account_info().try_borrow_mut_lamports()? += recovery_amount;
    
    // Update vault state
    session_vault.balance = 0;
    session_vault.total_withdrawn += recovery_amount;
    session_vault.last_activity = current_time;
    
    emit!(VaultRecovered {
        vault_owner: vault_owner.key(),
        recovery_destination: recovery_destination.key(),
        recovery_amount,
        inactivity_hours: inactivity_duration / 3600,
        admin1: admin1.key(),
        admin2: admin2.key(),
        timestamp: current_time,
    });
    
    msg!(
        "Inactive vault recovered: Owner: {}, Amount: {} lamports, Inactive for: {} hours, Admins: {}, {}",
        vault_owner.key(),
        recovery_amount,
        inactivity_duration / 3600,
        admin1.key(),
        admin2.key()
    );
    
    Ok(())
}

// Admin events
#[event]
pub struct EmergencyPauseActivated {
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct EmergencyPauseDeactivated {
    pub admin: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct FeesUpdated {
    pub admin: Pubkey,
    pub old_platform_fee_bps: u16,
    pub new_platform_fee_bps: u16,
    pub old_treasury_fee_bps: u16,
    pub new_treasury_fee_bps: u16,
    pub old_referral_fee_bps: u16,
    pub new_referral_fee_bps: u16,
    pub timestamp: i64,
}

#[event]
pub struct VaultRecovered {
    pub vault_owner: Pubkey,
    pub recovery_destination: Pubkey,
    pub recovery_amount: u64,
    pub inactivity_hours: i64,
    pub admin1: Pubkey,
    pub admin2: Pubkey,
    pub timestamp: i64,
} 