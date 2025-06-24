use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    ed25519_program,
    sysvar::instructions::{self, Instruction},
};

mod admin;
mod verifier;
mod session;

use admin::*;
use verifier::*;
use session::*;

declare_id!("51mQPjsgLs5XpPMmtux9jmTaRqbsi36jKoDGADfjzbDs");

#[program]
pub mod pv3 {
    use super::*;

    // ============= INITIALIZATION =============
    
    pub fn initialize(
        ctx: Context<Initialize>,
        treasury: Pubkey,
        referral_pool: Pubkey,
        verifier_pubkey: Pubkey,
        admin1: Pubkey,
        admin2: Pubkey,
        admin3: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        
        config.treasury = treasury;
        config.referral_pool = referral_pool;
        config.verifier_pubkey = verifier_pubkey;
        config.platform_fee_bps = 650; // 6.5% = 650 basis points
        config.treasury_fee_bps = 550; // 5.5% to treasury
        config.referral_fee_bps = 100; // 1% to referrals
        config.is_paused = false;
        config.total_matches = 0;
        config.total_volume = 0;
        config.admin_signers = [admin1, admin2, admin3];
        config.bump = ctx.bumps.config;
        
        emit!(PlatformInitialized {
            treasury,
            referral_pool,
            verifier_pubkey,
        });
        
        Ok(())
    }

    // ============= MATCH MANAGEMENT =============
    
    pub fn create_match(
        ctx: Context<CreateMatch>,
        game_id: String,
        wager_amount: u64,
        expiry_time: i64,
        use_session_vault: bool,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let match_account = &mut ctx.accounts.match_account;
        let creator = &ctx.accounts.creator;
        
        require!(!config.is_paused, PV3Error::PlatformPaused);
        require!(wager_amount >= 100_000_000, PV3Error::WagerTooLow); // Min 0.1 SOL
        require!(wager_amount <= 10_000_000_000, PV3Error::WagerTooHigh); // Max 10 SOL
        require!(expiry_time > Clock::get()?.unix_timestamp, PV3Error::InvalidExpiryTime);
        
        match_account.creator = creator.key();
        match_account.joiner = Pubkey::default();
        match_account.game_id = game_id.clone();
        match_account.wager_amount = wager_amount;
        match_account.total_pot = wager_amount;
        match_account.expiry_time = expiry_time;
        match_account.status = MatchStatus::WaitingForPlayer;
        match_account.winner = Pubkey::default();
        match_account.created_at = Clock::get()?.unix_timestamp;
        match_account.result_hash = [0u8; 32];
        match_account.bump = ctx.bumps.match_account;
        
        if use_session_vault {
            // Use funds from creator's session vault
            let session_vault = &mut ctx.accounts.session_vault.as_mut().unwrap();
            require!(
                session_vault.balance >= wager_amount,
                PV3Error::InsufficientSessionBalance
            );
            
            session_vault.balance -= wager_amount;
            session_vault.matches_played += 1;
            session_vault.last_activity = Clock::get()?.unix_timestamp;
        } else {
            // Direct SOL transfer from creator
            let transfer_instruction = anchor_lang::system_program::Transfer {
                from: creator.to_account_info(),
                to: ctx.accounts.match_escrow.to_account_info(),
            };
            
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    transfer_instruction,
                ),
                wager_amount,
            )?;
        }
        
        // Always transfer to match escrow
        **ctx.accounts.match_escrow.to_account_info().try_borrow_mut_lamports()? += wager_amount;
        
        emit!(MatchCreated {
            match_id: match_account.key(),
            creator: creator.key(),
            game_id,
            wager_amount,
            expiry_time,
        });
        
        Ok(())
    }

    pub fn join_match(
        ctx: Context<JoinMatch>,
        use_session_vault: bool,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let match_account = &mut ctx.accounts.match_account;
        let joiner = &ctx.accounts.joiner;
        
        require!(!config.is_paused, PV3Error::PlatformPaused);
        require!(
            match_account.status == MatchStatus::WaitingForPlayer,
            PV3Error::MatchNotAvailable
        );
        require!(
            match_account.creator != joiner.key(),
            PV3Error::CannotJoinOwnMatch
        );
        require!(
            Clock::get()?.unix_timestamp < match_account.expiry_time,
            PV3Error::MatchExpired
        );
        
        let wager_amount = match_account.wager_amount;
        
        if use_session_vault {
            // Use funds from joiner's session vault
            let session_vault = &mut ctx.accounts.session_vault.as_mut().unwrap();
            require!(
                session_vault.balance >= wager_amount,
                PV3Error::InsufficientSessionBalance
            );
            
            session_vault.balance -= wager_amount;
            session_vault.matches_played += 1;
            session_vault.last_activity = Clock::get()?.unix_timestamp;
        } else {
            // Direct SOL transfer from joiner
            let transfer_instruction = anchor_lang::system_program::Transfer {
                from: joiner.to_account_info(),
                to: ctx.accounts.match_escrow.to_account_info(),
            };
            
            anchor_lang::system_program::transfer(
                CpiContext::new(
                    ctx.accounts.system_program.to_account_info(),
                    transfer_instruction,
                ),
                wager_amount,
            )?;
        }
        
        // Always transfer to match escrow
        **ctx.accounts.match_escrow.to_account_info().try_borrow_mut_lamports()? += wager_amount;
        
        match_account.joiner = joiner.key();
        match_account.total_pot = wager_amount * 2;
        match_account.status = MatchStatus::InProgress;
        
        emit!(MatchJoined {
            match_id: match_account.key(),
            joiner: joiner.key(),
            total_pot: match_account.total_pot,
        });
        
        Ok(())
    }

    pub fn submit_result(
        ctx: Context<SubmitResult>,
        winner_pubkey: Pubkey,
        result_hash: [u8; 32],
        ed25519_signature: [u8; 64],
        ed25519_recovery_id: u8,
        ed25519_instruction_index: u8,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        let match_account = &mut ctx.accounts.match_account;
        
        require!(
            match_account.status == MatchStatus::InProgress,
            PV3Error::MatchNotInProgress
        );
        require!(
            winner_pubkey == match_account.creator || winner_pubkey == match_account.joiner,
            PV3Error::InvalidWinner
        );
        
        // Verify ed25519 signature from verifier service
        let instruction_sysvar = &ctx.accounts.instruction_sysvar;
        let current_instruction = instructions::get_instruction_relative(
            ed25519_instruction_index as i64, 
            instruction_sysvar
        )?;
        
        require!(
            current_instruction.program_id == ed25519_program::ID,
            PV3Error::InvalidSignatureInstruction
        );
        
        // Verify the signature is for our match result
        let expected_message = create_result_message(
            match_account.key(),
            winner_pubkey,
            result_hash,
        );
        
        verify_ed25519_signature(
            &ed25519_signature,
            &expected_message,
            config.verifier_pubkey.as_ref(),
            &current_instruction,
        )?;
        
        // Update match with verified result
        match_account.winner = winner_pubkey;
        match_account.result_hash = result_hash;
        match_account.status = MatchStatus::Completed;
        
        // Calculate fees according to whitepaper: 6.5% total (5.5% treasury, 1% referral)
        let total_pot = match_account.total_pot;
        let platform_fee = (total_pot * config.platform_fee_bps as u64) / 10000;
        let treasury_fee = (total_pot * config.treasury_fee_bps as u64) / 10000;
        let referral_fee = (total_pot * config.referral_fee_bps as u64) / 10000;
        let winner_amount = total_pot - platform_fee;
        
        // Transfer funds from escrow
        let escrow_balance = ctx.accounts.match_escrow.to_account_info().lamports();
        require!(escrow_balance >= total_pot, PV3Error::InsufficientEscrowBalance);
        
        // Transfer to winner
        **ctx.accounts.match_escrow.to_account_info().try_borrow_mut_lamports()? -= winner_amount;
        **ctx.accounts.winner.to_account_info().try_borrow_mut_lamports()? += winner_amount;
        
        // Transfer treasury fee
        **ctx.accounts.match_escrow.to_account_info().try_borrow_mut_lamports()? -= treasury_fee;
        **ctx.accounts.treasury.to_account_info().try_borrow_mut_lamports()? += treasury_fee;
        
        // Transfer referral fee
        **ctx.accounts.match_escrow.to_account_info().try_borrow_mut_lamports()? -= referral_fee;
        **ctx.accounts.referral_pool.to_account_info().try_borrow_mut_lamports()? += referral_fee;
        
        // Update global stats
        let config = &mut ctx.accounts.config;
        config.total_matches += 1;
        config.total_volume += total_pot;
        
        emit!(MatchCompleted {
            match_id: match_account.key(),
            winner: winner_pubkey,
            winner_amount,
            platform_fee,
            treasury_fee,
            referral_fee,
        });
        
        Ok(())
    }

    pub fn refund_match(ctx: Context<RefundMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        
        require!(
            Clock::get()?.unix_timestamp > match_account.expiry_time ||
            match_account.status == MatchStatus::Cancelled,
            PV3Error::RefundNotAllowed
        );
        
        let wager_amount = match_account.wager_amount;
        let escrow_balance = ctx.accounts.match_escrow.to_account_info().lamports();
        
        // Refund creator
        if escrow_balance >= wager_amount {
            **ctx.accounts.match_escrow.to_account_info().try_borrow_mut_lamports()? -= wager_amount;
            **ctx.accounts.creator.to_account_info().try_borrow_mut_lamports()? += wager_amount;
        }
        
        // Refund joiner if they joined
        if match_account.joiner != Pubkey::default() && escrow_balance >= wager_amount {
            **ctx.accounts.match_escrow.to_account_info().try_borrow_mut_lamports()? -= wager_amount;
            **ctx.accounts.joiner.to_account_info().try_borrow_mut_lamports()? += wager_amount;
        }
        
        match_account.status = MatchStatus::Refunded;
        
        emit!(MatchRefunded {
            match_id: match_account.key(),
            refund_amount: if match_account.joiner != Pubkey::default() { wager_amount * 2 } else { wager_amount },
        });
        
        Ok(())
    }

    // ============= SESSION MANAGEMENT =============
    
    pub fn create_session(ctx: Context<CreateSession>) -> Result<()> {
        session::create_session(ctx)
    }

    pub fn deposit_to_session(ctx: Context<DepositToSession>, amount: u64) -> Result<()> {
        session::deposit_to_session(ctx, amount)
    }

    pub fn withdraw_from_session(ctx: Context<WithdrawFromSession>, amount: u64) -> Result<()> {
        session::withdraw_from_session(ctx, amount)
    }

    // ============= ADMIN FUNCTIONS =============
    
    pub fn emergency_pause(ctx: Context<EmergencyAction>) -> Result<()> {
        admin::emergency_pause(ctx)
    }
    
    pub fn emergency_unpause(ctx: Context<EmergencyAction>) -> Result<()> {
        admin::emergency_unpause(ctx)
    }
    
    pub fn update_fees(
        ctx: Context<EmergencyAction>, 
        platform_fee_bps: u16,
        treasury_fee_bps: u16,
        referral_fee_bps: u16,
    ) -> Result<()> {
        admin::update_fees(ctx, platform_fee_bps, treasury_fee_bps, referral_fee_bps)
    }
    
    pub fn recover_inactive_vault(
        ctx: Context<RecoverVault>,
        inactivity_threshold_hours: u64,
    ) -> Result<()> {
        admin::recover_inactive_vault(ctx, inactivity_threshold_hours)
    }
}

// Helper functions
fn create_result_message(match_id: Pubkey, winner: Pubkey, result_hash: [u8; 32]) -> Vec<u8> {
    let mut message = Vec::new();
    message.extend_from_slice(&match_id.to_bytes());
    message.extend_from_slice(&winner.to_bytes());
    message.extend_from_slice(&result_hash);
    message
}

fn verify_ed25519_signature(
    signature: &[u8; 64],
    message: &[u8],
    pubkey: &[u8; 32],
    instruction: &Instruction,
) -> Result<()> {
    // Verify that the ed25519 instruction contains our signature verification
    require!(
        instruction.data.len() >= 112, // ed25519 instruction minimum size
        PV3Error::InvalidSignatureData
    );
    
    // Parse ed25519 instruction data to verify signature matches
    let num_signatures = instruction.data[0];
    require!(num_signatures == 1, PV3Error::InvalidSignatureCount);
    
    let signature_offset = 1;
    let pubkey_offset = signature_offset + 64;
    let message_data_offset = pubkey_offset + 32;
    
    let inst_signature = &instruction.data[signature_offset..signature_offset + 64];
    let inst_pubkey = &instruction.data[pubkey_offset..pubkey_offset + 32];
    
    require!(
        inst_signature == signature,
        PV3Error::SignatureMismatch
    );
    require!(
        inst_pubkey == pubkey,
        PV3Error::PublicKeyMismatch
    );
    
    Ok(())
}

// Account structures
#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + PlatformConfig::INIT_SPACE,
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, PlatformConfig>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(game_id: String)]
pub struct CreateMatch<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Match::INIT_SPACE,
        seeds = [b"match", creator.key().as_ref(), game_id.as_bytes(), &Clock::get().unwrap().unix_timestamp.to_le_bytes()],
        bump
    )]
    pub match_account: Account<'info, Match>,
    
    #[account(
        seeds = [b"escrow", match_account.key().as_ref()],
        bump
    )]
    /// CHECK: This is the PDA that holds the match funds
    pub match_escrow: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"session", creator.key().as_ref()],
        bump
    )]
    pub session_vault: Option<Account<'info, SessionVault>>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, PlatformConfig>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    
    #[account(
        mut,
        seeds = [b"escrow", match_account.key().as_ref()],
        bump
    )]
    /// CHECK: This is the PDA that holds the match funds
    pub match_escrow: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"session", joiner.key().as_ref()],
        bump
    )]
    pub session_vault: Option<Account<'info, SessionVault>>,
    
    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, PlatformConfig>,
    
    #[account(mut)]
    pub joiner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitResult<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    
    #[account(
        mut,
        seeds = [b"escrow", match_account.key().as_ref()],
        bump
    )]
    /// CHECK: This is the PDA that holds the match funds
    pub match_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Winner account to receive funds
    pub winner: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Treasury account for platform fees
    pub treasury: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Referral pool account
    pub referral_pool: AccountInfo<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, PlatformConfig>,
    
    /// CHECK: This is the instructions sysvar
    #[account(address = instructions::ID)]
    pub instruction_sysvar: AccountInfo<'info>,
    
    pub verifier: Signer<'info>,
}

#[derive(Accounts)]
pub struct RefundMatch<'info> {
    #[account(mut)]
    pub match_account: Account<'info, Match>,
    
    #[account(
        mut,
        seeds = [b"escrow", match_account.key().as_ref()],
        bump
    )]
    /// CHECK: This is the PDA that holds the match funds
    pub match_escrow: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Creator account for refund
    pub creator: AccountInfo<'info>,
    
    #[account(mut)]
    /// CHECK: Joiner account for refund
    pub joiner: AccountInfo<'info>,
}

// Account data structures
#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub treasury: Pubkey,
    pub referral_pool: Pubkey,
    pub verifier_pubkey: Pubkey,
    pub platform_fee_bps: u16,    // 650 = 6.5%
    pub treasury_fee_bps: u16,    // 550 = 5.5%
    pub referral_fee_bps: u16,    // 100 = 1%
    pub is_paused: bool,
    pub total_matches: u64,
    pub total_volume: u64,
    #[max_len(3)]
    pub admin_signers: [Pubkey; 3], // 2-of-3 multisig
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Match {
    pub creator: Pubkey,
    pub joiner: Pubkey,
    #[max_len(50)]
    pub game_id: String,
    pub wager_amount: u64,
    pub total_pot: u64,
    pub expiry_time: i64,
    pub status: MatchStatus,
    pub winner: Pubkey,
    pub created_at: i64,
    pub result_hash: [u8; 32],
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, InitSpace)]
pub enum MatchStatus {
    WaitingForPlayer,
    InProgress,
    Completed,
    Cancelled,
    Refunded,
}

// Events
#[event]
pub struct PlatformInitialized {
    pub treasury: Pubkey,
    pub referral_pool: Pubkey,
    pub verifier_pubkey: Pubkey,
}

#[event]
pub struct MatchCreated {
    pub match_id: Pubkey,
    pub creator: Pubkey,
    pub game_id: String,
    pub wager_amount: u64,
    pub expiry_time: i64,
}

#[event]
pub struct MatchJoined {
    pub match_id: Pubkey,
    pub joiner: Pubkey,
    pub total_pot: u64,
}

#[event]
pub struct MatchCompleted {
    pub match_id: Pubkey,
    pub winner: Pubkey,
    pub winner_amount: u64,
    pub platform_fee: u64,
    pub treasury_fee: u64,
    pub referral_fee: u64,
}

#[event]
pub struct MatchRefunded {
    pub match_id: Pubkey,
    pub refund_amount: u64,
}

// Error definitions
#[error_code]
pub enum PV3Error {
    #[msg("Platform is currently paused")]
    PlatformPaused,
    #[msg("Wager amount is too low (minimum 0.1 SOL)")]
    WagerTooLow,
    #[msg("Wager amount is too high (maximum 10 SOL)")]
    WagerTooHigh,
    #[msg("Invalid expiry time")]
    InvalidExpiryTime,
    #[msg("Match is not available for joining")]
    MatchNotAvailable,
    #[msg("Cannot join your own match")]
    CannotJoinOwnMatch,
    #[msg("Match has expired")]
    MatchExpired,
    #[msg("Match is not in progress")]
    MatchNotInProgress,
    #[msg("Invalid winner specified")]
    InvalidWinner,
    #[msg("Refund not allowed")]
    RefundNotAllowed,
    #[msg("Invalid amount specified")]
    InvalidAmount,
    #[msg("Insufficient session vault balance")]
    InsufficientSessionBalance,
    #[msg("Insufficient escrow balance")]
    InsufficientEscrowBalance,
    #[msg("Invalid signature instruction")]
    InvalidSignatureInstruction,
    #[msg("Invalid signature data")]
    InvalidSignatureData,
    #[msg("Invalid signature count")]
    InvalidSignatureCount,
    #[msg("Signature mismatch")]
    SignatureMismatch,
    #[msg("Public key mismatch")]
    PublicKeyMismatch,
    #[msg("Unauthorized admin action")]
    UnauthorizedAdmin,
    #[msg("Insufficient admin signatures")]
    InsufficientAdminSignatures,
} 