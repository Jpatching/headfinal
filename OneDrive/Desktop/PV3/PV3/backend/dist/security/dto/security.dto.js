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
exports.DisputeResultDto = exports.ReportCheatDto = exports.DisputeType = exports.ReportStatus = exports.ReportType = void 0;
const class_validator_1 = require("class-validator");
var ReportType;
(function (ReportType) {
    ReportType["CHEATING"] = "cheating";
    ReportType["EXPLOIT"] = "exploit";
    ReportType["HARASSMENT"] = "harassment";
    ReportType["FRAUD"] = "fraud";
    ReportType["OTHER"] = "other";
})(ReportType || (exports.ReportType = ReportType = {}));
var ReportStatus;
(function (ReportStatus) {
    ReportStatus["PENDING"] = "pending";
    ReportStatus["INVESTIGATING"] = "investigating";
    ReportStatus["RESOLVED"] = "resolved";
    ReportStatus["DISMISSED"] = "dismissed";
})(ReportStatus || (exports.ReportStatus = ReportStatus = {}));
var DisputeType;
(function (DisputeType) {
    DisputeType["MATCH_RESULT"] = "match_result";
    DisputeType["TECHNICAL_ISSUE"] = "technical_issue";
    DisputeType["UNFAIR_PLAY"] = "unfair_play";
})(DisputeType || (exports.DisputeType = DisputeType = {}));
class ReportCheatDto {
}
exports.ReportCheatDto = ReportCheatDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReportCheatDto.prototype, "reportedUser", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ReportType),
    __metadata("design:type", String)
], ReportCheatDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReportCheatDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReportCheatDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], ReportCheatDto.prototype, "evidence", void 0);
class DisputeResultDto {
}
exports.DisputeResultDto = DisputeResultDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DisputeResultDto.prototype, "matchId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(DisputeType),
    __metadata("design:type", String)
], DisputeResultDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DisputeResultDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], DisputeResultDto.prototype, "evidence", void 0);
//# sourceMappingURL=security.dto.js.map