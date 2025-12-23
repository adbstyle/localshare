import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user) {
    return this.usersService.findById(user.id);
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.id, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@CurrentUser() user) {
    await this.usersService.delete(user.id);
  }

  @Get('me/export')
  async exportData(@CurrentUser() user) {
    return this.usersService.exportData(user.id);
  }
}
