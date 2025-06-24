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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const class_validator_1 = require("class-validator");
class AuthenticateDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AuthenticateDto.prototype, "wallet", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AuthenticateDto.prototype, "signature", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AuthenticateDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AuthenticateDto.prototype, "timestamp", void 0);
class GenerateMessageDto {
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateMessageDto.prototype, "wallet", void 0);
let AuthController = AuthController_1 = class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async generateMessage(dto, req, res) {
        try {
            await (0, class_validator_1.validateOrReject)(Object.assign(new GenerateMessageDto(), dto));
            const message = this.authService.generateAuthMessage(dto.wallet);
            this.logger.log(`Generated auth message for wallet: ${dto.wallet}`);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                message,
                timestamp: Date.now(),
            });
        }
        catch (error) {
            this.logger.error(`Failed to generate message: ${error.message}`);
            if (Array.isArray(error)) {
                throw new common_1.BadRequestException('Invalid request data');
            }
            throw new common_1.BadRequestException(error.message);
        }
    }
    async authenticate(dto, req, res) {
        try {
            await (0, class_validator_1.validateOrReject)(Object.assign(new AuthenticateDto(), dto));
            const authRequest = {
                wallet: dto.wallet,
                signature: dto.signature,
                message: dto.message,
                timestamp: dto.timestamp,
            };
            const authResponse = await this.authService.authenticateWallet(authRequest);
            res.cookie('pv3_token', authResponse.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000,
            });
            this.logger.log(`User authenticated successfully: ${dto.wallet}`);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                user: authResponse.user,
                expiresAt: authResponse.expiresAt,
            });
        }
        catch (error) {
            this.logger.error(`Authentication failed: ${error.message}`);
            if (Array.isArray(error)) {
                throw new common_1.BadRequestException('Invalid request data');
            }
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.BadRequestException(error.message);
        }
    }
    async getProfile(authorization, req, res) {
        try {
            const token = this.extractToken(authorization, req);
            const user = await this.authService.getUserProfile(token);
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                user,
            });
        }
        catch (error) {
            this.logger.error(`Failed to get profile: ${error.message}`);
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
    }
    async logout(authorization, req, res) {
        try {
            const token = this.extractToken(authorization, req);
            await this.authService.logout(token);
            res.clearCookie('pv3_token');
            this.logger.log('User logged out successfully');
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            this.logger.error(`Logout failed: ${error.message}`);
            res.clearCookie('pv3_token');
            return res.status(common_1.HttpStatus.OK).json({
                success: true,
                message: 'Logged out',
            });
        }
    }
    async health(res) {
        return res.status(common_1.HttpStatus.OK).json({
            success: true,
            service: 'auth',
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
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('generate-message'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [GenerateMessageDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generateMessage", null);
__decorate([
    (0, common_1.Post)('authenticate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AuthenticateDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "authenticate", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('health'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "health", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map