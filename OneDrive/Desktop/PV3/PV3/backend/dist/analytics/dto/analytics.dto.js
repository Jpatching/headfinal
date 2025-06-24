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
exports.AnalyticsQueryDto = exports.MetricType = exports.TimeRange = void 0;
const class_validator_1 = require("class-validator");
var TimeRange;
(function (TimeRange) {
    TimeRange["HOUR"] = "1h";
    TimeRange["DAY"] = "24h";
    TimeRange["WEEK"] = "7d";
    TimeRange["MONTH"] = "30d";
    TimeRange["QUARTER"] = "90d";
    TimeRange["YEAR"] = "1y";
})(TimeRange || (exports.TimeRange = TimeRange = {}));
var MetricType;
(function (MetricType) {
    MetricType["REVENUE"] = "revenue";
    MetricType["USER_ACTIVITY"] = "user_activity";
    MetricType["GAME_PERFORMANCE"] = "game_performance";
    MetricType["REFERRAL_PERFORMANCE"] = "referral_performance";
})(MetricType || (exports.MetricType = MetricType = {}));
class AnalyticsQueryDto {
    constructor() {
        this.timeRange = TimeRange.DAY;
    }
}
exports.AnalyticsQueryDto = AnalyticsQueryDto;
__decorate([
    (0, class_validator_1.IsEnum)(TimeRange),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "timeRange", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(MetricType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "metricType", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], AnalyticsQueryDto.prototype, "gameId", void 0);
//# sourceMappingURL=analytics.dto.js.map