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
exports.JoinTournamentDto = exports.CreateTournamentDto = exports.TournamentStatus = exports.TournamentType = void 0;
const class_validator_1 = require("class-validator");
var TournamentType;
(function (TournamentType) {
    TournamentType["SINGLE_ELIMINATION"] = "single_elimination";
    TournamentType["DOUBLE_ELIMINATION"] = "double_elimination";
    TournamentType["ROUND_ROBIN"] = "round_robin";
})(TournamentType || (exports.TournamentType = TournamentType = {}));
var TournamentStatus;
(function (TournamentStatus) {
    TournamentStatus["UPCOMING"] = "upcoming";
    TournamentStatus["REGISTRATION"] = "registration";
    TournamentStatus["ACTIVE"] = "active";
    TournamentStatus["COMPLETED"] = "completed";
    TournamentStatus["CANCELLED"] = "cancelled";
})(TournamentStatus || (exports.TournamentStatus = TournamentStatus = {}));
class CreateTournamentDto {
}
exports.CreateTournamentDto = CreateTournamentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "gameId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], CreateTournamentDto.prototype, "entryFee", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(4),
    (0, class_validator_1.Max)(256),
    __metadata("design:type", Number)
], CreateTournamentDto.prototype, "maxParticipants", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(TournamentType),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTournamentDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Array)
], CreateTournamentDto.prototype, "prizePercentages", void 0);
class JoinTournamentDto {
}
exports.JoinTournamentDto = JoinTournamentDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], JoinTournamentDto.prototype, "tournamentId", void 0);
//# sourceMappingURL=tournament.dto.js.map