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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmergencyWithdrawDto = exports.FeeUpdateDto = exports.SystemMaintenanceDto = exports.BanPlayerDto = exports.SystemStatus = void 0;
const class_validator_1 = require("class-validator");
var SystemStatus;
(function (SystemStatus) {
    SystemStatus["ACTIVE"] = "active";
    SystemStatus["MAINTENANCE"] = "maintenance";
    SystemStatus["EMERGENCY"] = "emergency";
})(SystemStatus || (exports.SystemStatus = SystemStatus = {}));
class BanPlayerDto {
}
exports.BanPlayerDto = BanPlayerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BanPlayerDto.prototype, "walletAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], BanPlayerDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], BanPlayerDto.prototype, "durationHours", void 0);
class SystemMaintenanceDto {
}
exports.SystemMaintenanceDto = SystemMaintenanceDto;
__decorate([
    (0, class_validator_1.IsEnum)(SystemStatus),
    __metadata("design:type", String)
], SystemMaintenanceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SystemMaintenanceDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], SystemMaintenanceDto.prototype, "estimatedDurationMinutes", void 0);
class FeeUpdateDto {
}
exports.FeeUpdateDto = FeeUpdateDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], FeeUpdateDto.prototype, "platformFeePercentage", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], FeeUpdateDto.prototype, "referralFeePercentage", void 0);
class EmergencyWithdrawDto {
}
exports.EmergencyWithdrawDto = EmergencyWithdrawDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EmergencyWithdrawDto.prototype, "userWallet", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EmergencyWithdrawDto.prototype, "destinationWallet", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EmergencyWithdrawDto.prototype, "reason", void 0);
//# sourceMappingURL=admin.dto.js.map