import { Controller, Get } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from './prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get()
  health() {
    return { status: 'ok' };
  }

  // Touches the database. Called daily by the Vercel cron (apps/backend/vercel.json)
  // so the Supabase Free project is never paused for inactivity.
  @Public()
  @Get('db')
  async database() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'ok' };
  }
}
