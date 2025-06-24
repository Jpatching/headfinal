export declare class ConnectWalletDto {
    walletAddress: string;
    signature: string;
    message: string;
}
export declare class VerifySignatureDto {
    walletAddress: string;
    signature: string;
    message: string;
}
export declare class CreateSessionVaultDto {
    walletAddress: string;
}
export declare class DepositVaultDto {
    amount: string;
    transactionSignature?: string;
}
export declare class WithdrawVaultDto {
    amount: string;
    destinationAddress: string;
}
