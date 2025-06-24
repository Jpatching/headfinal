export declare class CreateMatchDto {
    gameId: string;
    wagerAmount: number;
    expiryTime: number;
    creatorWallet: string;
    sessionVault?: string;
}
export declare class JoinMatchDto {
    joinerWallet: string;
    sessionVault?: string;
}
export declare class SubmitResultDto {
    winnerWallet: string;
    signature: string;
    message: string;
    gameData?: any;
}
