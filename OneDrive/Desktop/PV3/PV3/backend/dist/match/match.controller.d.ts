import { Request, Response } from 'express';
import { MatchService } from './match.service';
import { AuthService } from '../auth/auth.service';
declare class CreateMatchRequestDto {
    gameType: string;
    wager: number;
    expiryMinutes?: number;
}
declare class SubmitResultRequestDto {
    matchId: string;
    winnerId: string;
    gameData: any;
    signature: string;
}
export declare class MatchController {
    private matchService;
    private authService;
    private readonly logger;
    constructor(matchService: MatchService, authService: AuthService);
    createMatch(dto: CreateMatchRequestDto, authorization: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    joinMatch(matchId: string, authorization: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    submitResult(matchId: string, dto: Omit<SubmitResultRequestDto, 'matchId'>, authorization: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    cancelMatch(matchId: string, authorization: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getMatch(matchId: string, res: Response): Promise<Response<any, Record<string, any>>>;
    getAvailableMatches(res: Response, gameType?: string, limit?: string): Promise<Response<any, Record<string, any>>>;
    getUserMatches(authorization: string, limit: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getMatchStats(authorization: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    health(res: Response): Promise<Response<any, Record<string, any>>>;
    private extractToken;
    private handleError;
}
export {};
