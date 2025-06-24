use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

mod admin;
mod verifier;

use admin::*;
use verifier::*;

declare_id!("11111111111111111111111111111111");

#[program]
pub mod pv3_program {
    use super::*;

    pub fn initialize_admin(
        ctx: Context<InitializeAdmin>,
        signers: [Pubkey; 3],
        platform_fee_account: Pubkey,
    ) -> Result<()> {
        let admin_config = &mut ctx.accounts.admin_config;
        admin_config.signers = signers;
        admin_config.min_signatures = 2; // 2-of-3 required
        admin_config.platform_fee_account = platform_fee_account;
        admin_config.nonce = 0;
        Ok(())
    }

    pub fn initialize_verifier(
        ctx: Context<InitializeVerifier>,
        verifier_pubkey: Pubkey,
        admin_config: Pubkey,
    ) -> Result<()> {
        let verifier_config = &mut ctx.accounts.verifier_config;
        verifier_config.verifier_pubkey = verifier_pubkey;
        verifier_config.admin_config = admin_config;
        verifier_config.is_active = true;
        verifier_config.nonce = 0;
        Ok(())
    }

    pub fn create_match(
        ctx: Context<CreateMatch>,
        wager_amount: u64,
        game_id: String,
        expiry: i64,
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let creator = &ctx.accounts.creator;
        
        // Verify game is not paused
        require!(
            !ctx.accounts.admin_config.is_paused,
            PV3Error::GamePaused
        );
        
        match_account.creator = creator.key();
        match_account.wager_amount = wager_amount;
        match_account.game_id = game_id;
        match_account.expiry = expiry;
        match_account.state = MatchState::Created;
        
        // Transfer wager to PDA
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &creator.key(),
            &match_account.key(),
            wager_amount,
        );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                creator.to_account_info(),
                match_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        Ok(())
    }

    pub fn join_match(ctx: Context<JoinMatch>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let joiner = &ctx.accounts.joiner;
        
        // Verify game is not paused
        require!(
            !ctx.accounts.admin_config.is_paused,
            PV3Error::GamePaused
        );
        
        require!(
            match_account.state == MatchState::Created,
            PV3Error::InvalidMatchState
        );
        
        // Transfer wager to PDA
        let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
            &joiner.key(),
            &match_account.key(),
            match_account.wager_amount,
        );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_ix,
            &[
                joiner.to_account_info(),
                match_account.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;
        
        match_account.joiner = Some(joiner.key());
        match_account.state = MatchState::InProgress;
        
        Ok(())
    }

    pub fn submit_result(
        ctx: Context<SubmitResult>,
        winner: Pubkey,
        verifier_signature: [u8; 64],
    ) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let verifier_config = &ctx.accounts.verifier_config;
        let admin_config = &ctx.accounts.admin_config;
        
        require!(
            match_account.state == MatchState::InProgress,
            PV3Error::InvalidMatchState
        );

        require!(
            verifier_config.is_active,
            VerifierError::VerifierNotActive
        );
        
        // Verify signature
        let msg = create_result_message(
            match_account.key(),
            winner,
            Clock::get()?.unix_timestamp,
        );
        
        let sig_valid = verify_signature(
            &ctx.accounts.verify_signature,
            verifier_config.verifier_pubkey.to_bytes(),
            &msg,
            verifier_signature,
        )?;
        
        require!(sig_valid, VerifierError::InvalidSignature);
        
        // Calculate rewards (93.5% to winner, 6.5% to platform)
        let total_pot = match_account.wager_amount * 2;
        let platform_fee = (total_pot as f64 * 0.065) as u64;
        let winner_amount = total_pot - platform_fee;
        
        // Transfer winnings
        **match_account.to_account_info().try_borrow_mut_lamports()? -= winner_amount;
        **ctx.accounts.winner.try_borrow_mut_lamports()? += winner_amount;
        
        // Transfer platform fee
        **match_account.to_account_info().try_borrow_mut_lamports()? -= platform_fee;
        **ctx.accounts.platform_fee_account.try_borrow_mut_lamports()? += platform_fee;
        
        match_account.state = MatchState::Completed;
        match_account.winner = Some(winner);
        
        Ok(())
    }

    pub fn claim_timeout(ctx: Context<ClaimTimeout>) -> Result<()> {
        let match_account = &mut ctx.accounts.match_account;
        let clock = Clock::get()?;
        
        require!(
            clock.unix_timestamp >= match_account.expiry,
            PV3Error::TimeoutNotReached
        );
        
        match match_account.state {
            MatchState::Created => {
                // Refund creator
                let refund_amount = match_account.wager_amount;
                **match_account.to_account_info().try_borrow_mut_lamports()? -= refund_amount;
                **ctx.accounts.creator.try_borrow_mut_lamports()? += refund_amount;
            }
            MatchState::InProgress => {
                // Refund both players
                let refund_amount = match_account.wager_amount;
                **match_account.to_account_info().try_borrow_mut_lamports()? -= refund_amount * 2;
                **ctx.accounts.creator.try_borrow_mut_lamports()? += refund_amount;
                **ctx.accounts.joiner.try_borrow_mut_lamports()? += refund_amount;
            }
            _ => return err!(PV3Error::InvalidMatchState),
        }
        
        match_account.state = MatchState::Expired;
        Ok(())
    }

    // Admin emergency actions
    pub fn execute_emergency_action(
        ctx: Context<EmergencyAction>,
        action_type: EmergencyActionType,
    ) -> Result<()> {
        match action_type {
            EmergencyActionType::PauseMatches => {
                ctx.accounts.admin_config.is_paused = true;
            }
            EmergencyActionType::UnpauseMatches => {
                ctx.accounts.admin_config.is_paused = false;
            }
            EmergencyActionType::RecoverStuckFunds => {
                // Logic for recovering stuck funds
                // This requires careful implementation
            }
            EmergencyActionType::UpdatePlatformFee => {
                // Logic for updating platform fee
                // This requires careful implementation
            }
        }
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMatch<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = MatchAccount::SIZE,
        seeds = [b"match", creator.key().as_ref()],
        bump
    )]
    pub match_account: Account<'info, MatchAccount>,

    pub admin_config: Account<'info, AdminConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinMatch<'info> {
    #[account(mut)]
    pub joiner: Signer<'info>,
    
    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,

    pub admin_config: Account<'info, AdminConfig>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitResult<'info> {
    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,
    
    pub verifier_config: Account<'info, VerifierConfig>,
    pub admin_config: Account<'info, AdminConfig>,
    
    /// CHECK: Winner account to receive funds
    #[account(mut)]
    pub winner: AccountInfo<'info>,
    
    /// CHECK: Platform fee account from admin config
    #[account(
        mut,
        constraint = platform_fee_account.key() == admin_config.platform_fee_account
    )]
    pub platform_fee_account: AccountInfo<'info>,

    pub verify_signature: VerifySignature<'info>,
}

#[derive(Accounts)]
pub struct ClaimTimeout<'info> {
    #[account(mut)]
    pub match_account: Account<'info, MatchAccount>,
    
    /// CHECK: Creator account for refund
    #[account(mut)]
    pub creator: AccountInfo<'info>,
    
    /// CHECK: Joiner account for refund
    #[account(mut)]
    pub joiner: AccountInfo<'info>,
}

#[account]
pub struct MatchAccount {
    pub creator: Pubkey,
    pub joiner: Option<Pubkey>,
    pub winner: Option<Pubkey>,
    pub wager_amount: u64,
    pub game_id: String,
    pub expiry: i64,
    pub state: MatchState,
}

impl MatchAccount {
    pub const SIZE: usize = 32 + 33 + 33 + 8 + 32 + 8 + 1 + 8;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum MatchState {
    Created,
    InProgress,
    Completed,
    Expired,
}

#[error_code]
pub enum PV3Error {
    #[msg("Invalid match state for this operation")]
    InvalidMatchState,
    #[msg("Match timeout period has not been reached")]
    TimeoutNotReached,
    #[msg("Game is currently paused")]
    GamePaused,
} 