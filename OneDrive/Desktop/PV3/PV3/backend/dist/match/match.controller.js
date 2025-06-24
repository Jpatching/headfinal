"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var MatchController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchController = void 0;
const common_1 = require("@nestjs/common");
const match_service_1 = require("./match.service");
const auth_service_1 = require("../auth/auth.service");
const class_validator_1 = require("class-validator");
class CreateMatchRequestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateMatchRequestDto.prototype, "gameType", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    (0, class_validator_1.Max)(10.0),
    __metadata("design:type", Number)
], CreateMatchRequestDto.prototype, "wager", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(120),
    __metadata("design:type", Number)
], CreateMatchRequestDto.prototype, "expiryMinutes", void 0);
class JoinMatchRequestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], JoinMatchRequestDto.prototype, "matchId", void 0);
class SubmitResultRequestDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitResultRequestDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitResultRequestDto.prototype, "winnerId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], SubmitResultRequestDto.prototype, "gameData", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitResultRequestDto.prototype, "signature", void 0);
let MatchController = MatchController_1 = class MatchController {
    constructor(matchService, authService) {
        this.matchService = matchService;
        this.authService = authService;
        this.logger = new common_1.Logger(MatchController_1.name);
    }
    async createMatch(dto, authorization, req, res) {
        try {
            await (0, class_validator_1.validateOrReject)(Object.assign(new CreateMatchRequestDto(), dto));
            const token = this.extractToken(authorization, req);
            const tokenData = await this.authService.validateToken(token);
            if (!tokenData) {
                throw new common_1.UnauthorizedException('Invalid or expired token');
            }
            const createMatchDto = {
                gameType: dto.gameType,
                wager: dto.wager,
                expiryMinutes: dto.expiryMinutes,
            };
            const match = await this.matchService.createMatch(tokenData.userId, createMatchDto);
            this.logger.log(`Match created by user ${tokenData.userId}: ${match.id}`);
            return res.status(common_1.HttpStatus.CREATED).json({
                success: true,
                match,
            });
        }
        catch (error) {
            this.logger.error(`Failed to create match: ${error.message}`);
            this.handleError(error, res);
        }
    }
    async joinMatch(matchId, authorization, req, res) {
        try {
            const token = this.extractToken(authorization, req);
            const tokenData = await this.authService.validateToken(token);
            if (!tokenData) {
                throw new common_1.UnauthorizedException('Invalid or expired token');
            }
            const joinMatchDto = { matchId };
            const match = await this.matchService.joinMatch(tokenData.userId, joinMatchDto);
            this.logger.log(`Match joined by user ${tokenData.userId}: ${matchId}`);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                match,
            });
        }
        catch (error) {
            this.logger.error(`Failed to join match: ${error.message}`);
            this.handleError(error, res);
        }
    }
    async submitResult(matchId, dto, authorization, req, res) {
        try {
            const submitDto = Object.assign(new SubmitResultRequestDto(), { ...dto, matchId });
            await (0, class_validator_1.validateOrReject)(submitDto);
            const token = this.extractToken(authorization, req);
            const tokenData = await this.authService.validateToken(token);
            if (!tokenData) {
                throw new common_1.UnauthorizedException('Invalid or expired token');
            }
            const submitResultDto = {
                matchId,
                winnerId: dto.winnerId,
                gameData: dto.gameData,
                signature: dto.signature,
            };
            const match = await this.matchService.submitResult(tokenData.userId, submitResultDto);
            this.logger.log(`Match result submitted by user ${tokenData.userId}: ${matchId}`);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                match,
            });
        }
        catch (error) {
            this.logger.error(`Failed to submit result: ${error.message}`);
            this.handleError(error, res);
        }
    }
    async cancelMatch(matchId, authorization, req, res) {
        try {
            const token = this.extractToken(authorization, req);
            const tokenData = await this.authService.validateToken(token);
            if (!tokenData) {
                throw new common_1.UnauthorizedException('Invalid or expired token');
            }
            await this.matchService.cancelMatch(tokenData.userId, matchId);
            this.logger.log(`Match cancelled by user ${tokenData.userId}: ${matchId}`);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                message: 'Match cancelled successfully',
            });
        }
        catch (error) {
            this.logger.error(`Failed to cancel match: ${error.message}`);
            this.handleError(error, res);
        }
    }
    async getMatch(matchId, res) {
        try {
            const match = await this.matchService.getMatch(matchId);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                match,
            });
        }
        catch (error) {
            this.logger.error(`Failed to get match: ${error.message}`);
            this.handleError(error, res);
        }
    }
    async getAvailableMatches(res, gameType, limit) {
        try {
            const limitNum = limit ? parseInt(limit, 10) : 20;
            if (limitNum > 100) {
                throw new common_1.BadRequestException('Limit cannot exceed 100');
            }
            const matches = await this.matchService.getAvailableMatches(gameType, limitNum);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                matches,
                count: matches.length,
            });
        }
        catch (error) {
            this.logger.error(`Failed to get available matches: ${error.message}`);
            this.handleError(error, res);
        }
    }
    async getUserMatches(authorization, limit, req, res) {
        try {
            const token = this.extractToken(authorization, req);
            const tokenData = await this.authService.validateToken(token);
            if (!tokenData) {
                throw new common_1.UnauthorizedException('Invalid or expired token');
            }
            const limitNum = limit ? parseInt(limit, 10) : 50;
            if (limitNum > 200) {
                throw new common_1.BadRequestException('Limit cannot exceed 200');
            }
            const matches = await this.matchService.getUserMatches(tokenData.userId, limitNum);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                matches,
                count: matches.length,
            });
        }
        catch (error) {
            this.logger.error(`Failed to get user matches: ${error.message}`);
            this.handleError(error, res);
        }
    }
    async getMatchStats(authorization, req, res) {
        try {
            const token = this.extractToken(authorization, req);
            const tokenData = await this.authService.validateToken(token);
            if (!tokenData) {
                throw new common_1.UnauthorizedException('Invalid or expired token');
            }
            const user = await this.authService.getUserProfile(token);
            const stats = {
                totalMatches: user.totalMatches,
                wins: user.wins,
                losses: user.losses,
                winRate: user.winRate,
                totalEarnings: user.totalEarnings,
                reputation: user.reputation,
            };
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                stats,
            });
        }
        catch (error) {
            this.logger.error(`Failed to get match stats: ${error.message}`);
            this.handleError(error, res);
        }
    }
    async health(res) {
        return res.status(common_1.HttpStatus.OK).json({
            success: true,
            service: 'matches',
            timestamp: Date.now(),
        });
    }
    extractToken(authorization, req) {
        if (authorization && authorization.startsWith('Bearer ')) {
            return authorization.substring(7);
        }
        if (req.cookies && req.cookies.pv3_token) {
            return req.cookies.pv3_token;
        }
        throw new common_1.UnauthorizedException('No authentication token provided');
    }
    handleError(error, res) {
        if (Array.isArray(error)) {
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                error: 'Validation failed',
                details: error,
            });
        }
        if (error instanceof common_1.UnauthorizedException) {
            return res.status(common_1.HttpStatus.UNAUTHORIZED).json({
                success: false,
                error: error.message,
            });
        }
        if (error instanceof common_1.BadRequestException) {
            return res.status(common_1.HttpStatus.BAD_REQUEST).json({
                success: false,
                error: error.message,
            });
        }
        return res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            error: 'Internal server error',
        });
    }
};
exports.MatchController = MatchController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateMatchRequestDto, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "createMatch", null);
__decorate([
    (0, common_1.Post)(':id/join'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "joinMatch", null);
__decorate([
    (0, common_1.Post)(':id/result'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Headers)('authorization')),
    __param(3, (0, common_1.Req)()),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "submitResult", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('authorization')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "cancelMatch", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "getMatch", null);
__decorate([
    (0, common_1.Get)('available/list'),
    __param(0, (0, common_1.Res)()),
    __param(1, (0, common_1.Query)('gameType')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "getAvailableMatches", null);
__decorate([
    (0, common_1.Get)('history/list'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Req)()),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "getUserMatches", null);
__decorate([
    (0, common_1.Get)('stats/summary'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "getMatchStats", null);
__decorate([
    (0, common_1.Get)('health/check'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MatchController.prototype, "health", null);
exports.MatchController = MatchController = MatchController_1 = __decorate([
    (0, common_1.Controller)('matches'),
    __metadata("design:paramtypes", [match_service_1.MatchService,
        auth_service_1.AuthService])
], MatchController);
//# sourceMappingURL=match.controller.js.map