import { Controller, Get, Post, Body, Param, Headers, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';
import { BanPlayerDto, SystemMaintenanceDto, FeeUpdateDto, EmergencyWithdrawDto } from './dto/admin.dto';
import { AuthService } from '../auth/auth.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly authService: AuthService,
  ) {}

  @Get('dashboard')
  async getDashboard(@Headers('authorization') auth: string) {
    await this.validateAdminSession(auth);
    const dashboard = await this.adminService.getDashboard();
    return { dashboard };
  }

  @Post('ban-player')
  async banPlayer(
    @Headers('authorization') auth: string,
    @Body() banPlayerDto: BanPlayerDto
  ) {
    const session = await this.validateAdminSession(auth);
    return this.adminService.banPlayer(session.wallet, banPlayerDto);
  }

  @Post('unban-player')
  async unbanPlayer(
    @Headers('authorization') auth: string,
    @Body() body: { walletAddress: string; reason: string }
  ) {
    const session = await this.validateAdminSession(auth);
    return this.adminService.unbanPlayer(session.wallet, body.walletAddress, body.reason);
  }

  @Post('system-maintenance')
  async setSystemMaintenance(
    @Headers('authorization') auth: string,
    @Body() maintenanceDto: SystemMaintenanceDto
  ) {
    const session = await this.validateAdminSession(auth);
    return this.adminService.setSystemMaintenance(session.wallet, maintenanceDto);
  }

  @Post('update-fees')
  async updateFees(
    @Headers('authorization') auth: string,
    @Body() feeUpdateDto: FeeUpdateDto
  ) {
    const session = await this.validateAdminSession(auth);
    return this.adminService.updateFees(session.wallet, feeUpdateDto);
  }

  @Post('emergency-withdraw')
  async emergencyWithdraw(
    @Headers('authorization') auth: string,
    @Body() withdrawDto: EmergencyWithdrawDto
  ) {
    const session = await this.validateAdminSession(auth);
    return this.adminService.emergencyWithdraw(session.wallet, withdrawDto);
  }

  @Get('user-actions')
  async getUserActions(@Headers('authorization') auth: string) {
    await this.validateAdminSession(auth);
    const actions = await this.adminService.getUserActions();
    return { actions };
  }

  @Get('system-alerts')
  async getSystemAlerts(@Headers('authorization') auth: string) {
    await this.validateAdminSession(auth);
    const alerts = await this.adminService.getSystemAlerts();
    return { alerts };
  }

  @Post('acknowledge-alert/:id')
  async acknowledgeAlert(
    @Headers('authorization') auth: string,
    @Param('id') id: string
  ) {
    const session = await this.validateAdminSession(auth);
    return this.adminService.acknowledgeAlert(session.wallet, id);
  }

  @Get('system-status')
  async getSystemStatus() {
    return this.adminService.getSystemStatus();
  }

  @Get('fee-structure')
  async getFeeStructure() {
    return this.adminService.getFeeStructure();
  }

  @Get('system-health')
  async getSystemHealth(@Headers('authorization') auth: string) {
    await this.validateAdminSession(auth);
    const health = await this.adminService.getSystemHealth();
    return { health };
  }

  private async validateAdminSession(authHeader: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid authorization header');
    }
    const sessionId = authHeader.substring(7);
    const session = await this.authService.validateSession(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    
    // Check if user is admin
    if (!this.adminService.isAdmin(session.wallet)) {
      throw new UnauthorizedException('Admin access required');
    }
    
    return session;
  }
} 