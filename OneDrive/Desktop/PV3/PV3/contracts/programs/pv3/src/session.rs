use anchor_lang::prelude::*;

/// Session Vault Manager - Enables smooth UX by allowing users to deposit SOL
/// into session PDAs and use for multiple matches without repeated wallet approvals
#[derive(Accounts)]
pub struct CreateSession<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + SessionVault::INIT_SPACE,
        seeds = [b"session", user.key().as_ref()],
        bump
    )]
    pub session_vault: Account<'info, SessionVault>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DepositToSession<'info> {
    #[account(
        mut,
        seeds = [b"session", user.key().as_ref()],
        bump = session_vault.bump
    )]
    pub session_vault: Account<'info, SessionVault>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFromSession<'info> {
    #[account(
        mut,
        seeds = [b"session", user.key().as_ref()],
        bump = session_vault.bump
    )]
    pub session_vault: Account<'info, SessionVault>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UseSessionFunds<'info> {
    #[account(
        mut,
        seeds = [b"session", user.key().as_ref()],
        bump = session_vault.bump,
        constraint = session_vault.balance >= amount @ PV3Error::InsufficientSessionBalance
    )]
    pub session_vault: Account<'info, SessionVault>,
    
    #[account(mut)]
    /// CHECK: Destination account (match escrow)
    pub destination: AccountInfo<'info>,
    
    pub user: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct SessionVault {
    pub owner: Pubkey,
    pub balance: u64,
    pub total_deposited: u64,
    pub total_withdrawn: u64,
    pub matches_played: u64,
    pub created_at: i64,
    pub last_activity: i64,
    pub bump: u8,
}

// Session management functions
pub fn create_session(ctx: Context<CreateSession>) -> Result<()> {
    let session_vault = &mut ctx.accounts.session_vault;
    let user = &ctx.accounts.user;
    
    session_vault.owner = user.key();
    session_vault.balance = 0;
    session_vault.total_deposited = 0;
    session_vault.total_withdrawn = 0;
    session_vault.matches_played = 0;
    session_vault.created_at = Clock::get()?.unix_timestamp;
    session_vault.last_activity = Clock::get()?.unix_timestamp;
    session_vault.bump = ctx.bumps.session_vault;
    
    emit!(SessionCreated {
        user: user.key(),
        session_vault: session_vault.key(),
    });
    
    Ok(())
}

pub fn deposit_to_session(ctx: Context<DepositToSession>, amount: u64) -> Result<()> {
    let session_vault = &mut ctx.accounts.session_vault;
    let user = &ctx.accounts.user;
    
    require!(amount > 0, PV3Error::InvalidAmount);
    
    // Transfer SOL from user to session vault PDA
    let transfer_instruction = anchor_lang::system_program::Transfer {
        from: user.to_account_info(),
        to: session_vault.to_account_info(),
    };
    
    anchor_lang::system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            transfer_instruction,
        ),
        amount,
    )?;
    
    session_vault.balance += amount;
    session_vault.total_deposited += amount;
    session_vault.last_activity = Clock::get()?.unix_timestamp;
    
    emit!(SessionDeposit {
        user: user.key(),
        amount,
        new_balance: session_vault.balance,
    });
    
    Ok(())
}

pub fn withdraw_from_session(ctx: Context<WithdrawFromSession>, amount: u64) -> Result<()> {
    let session_vault = &mut ctx.accounts.session_vault;
    let user = &ctx.accounts.user;
    
    require!(amount > 0, PV3Error::InvalidAmount);
    require!(session_vault.balance >= amount, PV3Error::InsufficientSessionBalance);
    
    // Transfer SOL from session vault PDA to user
    let seeds = &[
        b"session",
        user.key().as_ref(),
        &[session_vault.bump],
    ];
    let signer_seeds = &[&seeds[..]];
    
    **session_vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **user.to_account_info().try_borrow_mut_lamports()? += amount;
    
    session_vault.balance -= amount;
    session_vault.total_withdrawn += amount;
    session_vault.last_activity = Clock::get()?.unix_timestamp;
    
    emit!(SessionWithdraw {
        user: user.key(),
        amount,
        new_balance: session_vault.balance,
    });
    
    Ok(())
}

pub fn use_session_funds(
    ctx: Context<UseSessionFunds>, 
    amount: u64
) -> Result<()> {
    let session_vault = &mut ctx.accounts.session_vault;
    let user = &ctx.accounts.user;
    
    require!(amount > 0, PV3Error::InvalidAmount);
    require!(session_vault.balance >= amount, PV3Error::InsufficientSessionBalance);
    
    // Transfer from session vault to destination (usually match escrow)
    let seeds = &[
        b"session",
        user.key().as_ref(),
        &[session_vault.bump],
    ];
    let _signer_seeds = &[&seeds[..]];
    
    **session_vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.destination.to_account_info().try_borrow_mut_lamports()? += amount;
    
    session_vault.balance -= amount;
    session_vault.matches_played += 1;
    session_vault.last_activity = Clock::get()?.unix_timestamp;
    
    Ok(())
}

// Events
#[event]
pub struct SessionCreated {
    pub user: Pubkey,
    pub session_vault: Pubkey,
}

#[event]
pub struct SessionDeposit {
    pub user: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
}

#[event]
pub struct SessionWithdraw {
    pub user: Pubkey,
    pub amount: u64,
    pub new_balance: u64,
}

// Additional error variants (to be added to main error enum)
use crate::PV3Error;

impl PV3Error {
    pub const INVALID_AMOUNT: Self = Self::InvalidAmount;
    pub const INSUFFICIENT_SESSION_BALANCE: Self = Self::InsufficientSessionBalance;
} 