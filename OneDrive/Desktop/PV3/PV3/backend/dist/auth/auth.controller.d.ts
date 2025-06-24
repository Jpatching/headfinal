import { Request, Response } from 'express';
import { AuthService } from './auth.service';
declare class AuthenticateDto {
    wallet: string;
    signature: string;
    message: string;
    timestamp: number;
}
declare class GenerateMessageDto {
    wallet: string;
}
export declare class AuthController {
    private authService;
    private readonly logger;
    constructor(authService: AuthService);
    generateMessage(dto: GenerateMessageDto, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    authenticate(dto: AuthenticateDto, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    getProfile(authorization: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    logout(authorization: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    health(res: Response): Promise<Response<any, Record<string, any>>>;
    private extractToken;
}
export {};
