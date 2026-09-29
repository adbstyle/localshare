import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

// No eager $connect(): Prisma connects lazily on the first query. Keeps cold
// starts short (Vercel only waits ~1s for app.listen() after module import).
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
