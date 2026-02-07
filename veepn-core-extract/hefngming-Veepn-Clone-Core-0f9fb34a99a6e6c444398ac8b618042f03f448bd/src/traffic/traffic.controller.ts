import { Controller, Post, Get, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TrafficService } from './traffic.service';
import { ReportTrafficDto } from './dto/traffic.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('traffic')
@UseGuards(JwtAuthGuard)
export class TrafficController {
  constructor(private trafficService: TrafficService) {}

  @Post('report')
  async reportTraffic(@Request() req, @Body() dto: ReportTrafficDto) {
    return this.trafficService.reportTraffic(req.user.userId, dto.bytes);
  }

  @Get('history')
  async getTrafficHistory(@Request() req, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 7;
    return this.trafficService.getTrafficHistory(req.user.userId, daysNum);
  }
}
