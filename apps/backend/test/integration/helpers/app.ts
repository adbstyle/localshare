import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../../../src/app.module';
import { configureApp } from '../../../src/app.setup';
import { PrismaService } from '../../../src/database/prisma.service';

export interface ApiResponse {
  status: number;
  body: any;
}

export interface RequestOptions {
  as?: string; // user id to authenticate as
  body?: unknown;
  viaCookie?: boolean;
  cookie?: string; // raw Cookie header, e.g. a refresh token
}

export class TestApp {
  constructor(
    readonly prisma: PrismaService,
    private readonly nestApp: NestExpressApplication,
    private readonly jwt: JwtService,
    private readonly baseUrl: string,
  ) {}

  /** Resolve a provider from the running app, e.g. a service under test. */
  get<T>(token: new (...args: any[]) => T): T {
    return this.nestApp.get(token, { strict: false });
  }

  tokenFor(userId: string): string {
    return this.jwt.sign({ sub: userId });
  }

  async request(method: string, path: string, options: RequestOptions = {}): Promise<ApiResponse> {
    const headers: Record<string, string> = {};
    if (options.as) {
      const token = this.tokenFor(options.as);
      if (options.viaCookie) headers.cookie = `accessToken=${token}`;
      else headers.authorization = `Bearer ${token}`;
    }

    if (options.cookie) headers.cookie = options.cookie;

    let body: BodyInit | undefined;
    if (options.body instanceof FormData) {
      body = options.body;
    } else if (options.body !== undefined) {
      headers['content-type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    const response = await fetch(`${this.baseUrl}/api/v1${path}`, { method, headers, body });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    return { status: response.status, body: isJson ? await response.json() : undefined };
  }

  close(): Promise<void> {
    return this.nestApp.close();
  }
}

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const nestApp = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
  configureApp(nestApp);
  await nestApp.listen(0);

  return new TestApp(
    nestApp.get(PrismaService),
    nestApp,
    nestApp.get(JwtService, { strict: false }),
    await nestApp.getUrl(),
  );
}
