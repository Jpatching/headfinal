"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SolanaModule = void 0;
const common_1 = require("@nestjs/common");
const solana_service_1 = require("./solana.service");
let SolanaModule = class SolanaModule {
};
exports.SolanaModule = SolanaModule;
exports.SolanaModule = SolanaModule = __decorate([
    (0, common_1.Module)({
        providers: [solana_service_1.SolanaService],
        exports: [solana_service_1.SolanaService],
    })
], SolanaModule);
//# sourceMappingURL=solana.module.js.map