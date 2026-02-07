import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NodeService } from './node.service';
import { CreateNodeDto, UpdateNodeDto } from './dto/node.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('nodes')
@UseGuards(JwtAuthGuard)
export class NodeController {
  constructor(private nodeService: NodeService) {}

  @Get()
  async getAvailableNodes(@Request() req) {
    return this.nodeService.getAvailableNodes(req.user.userId);
  }

  @Get(':id')
  async getNodeById(@Param('id') id: string, @Request() req) {
    return this.nodeService.getNodeById(id, req.user.userId);
  }

  // 管理员端点（实际应用中需要添加管理员权限守卫）
  @Post()
  async createNode(@Body() dto: CreateNodeDto) {
    return this.nodeService.createNode(dto);
  }

  @Put(':id')
  async updateNode(@Param('id') id: string, @Body() dto: UpdateNodeDto) {
    return this.nodeService.updateNode(id, dto);
  }

  @Delete(':id')
  async deleteNode(@Param('id') id: string) {
    return this.nodeService.deleteNode(id);
  }
}
