import { Test, TestingModule } from '@nestjs/testing';
import { TiktokService } from './tiktok.service';
import { STORAGE_SERVICE } from '../../config/injection-tokens';
import axios from 'axios';

// Mock de la librería axios completa
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('TiktokService', () => {
  let service: TiktokService;
  
  // Mock para la instancia creada con axios.create()
  const mockTiktokApiInstance = {
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };

  const mockStorageService = {
    read: jest.fn(),
  };

  beforeEach(async () => {
    // Cuando se llame a axios.create, devolvemos nuestra instancia mockeada
    mockedAxios.create.mockReturnValue(mockTiktokApiInstance as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TiktokService,
        { provide: STORAGE_SERVICE, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<TiktokService>(TiktokService);
    
    // Evitar sleeps en tests
    jest.spyOn(service as any, 'sleep').mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe fallar si no hay archivo de video', async () => {
    const result = await service.publish({ textContent: 'Video' });
    expect(result.success).toBe(false);
  });

  it('debe ejecutar el flujo completo de publicación', async () => {
    const fileBuffer = Buffer.from('video-data');
    mockStorageService.read.mockResolvedValue(fileBuffer);

    // PASO 1: Initiate Publish (usando la instancia privada tiktokApi)
    mockTiktokApiInstance.post.mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          publish_id: 'pub_123',
          upload_url: 'http://tiktok.upload',
        },
        error: { code: 'ok' },
      },
    });

    // PASO 2: Upload Video (usando axios global mockeado)
    mockedAxios.put.mockResolvedValueOnce({ status: 200 });

    // PASO 3: Polling Status (usando instancia privada tiktokApi)
    // Simulamos que completa en el primer intento
    mockTiktokApiInstance.post.mockResolvedValueOnce({
      status: 200,
      data: {
        data: {
          status: 'PUBLISH_COMPLETE',
          publicly_available_post_id: ['post_final_id'],
        },
      },
    });

    const result = await service.publish({ textContent: 'My Video', fileUrl: 'video.mp4' });

    expect(result.success).toBe(true);
    // Verificar Init
    expect(mockTiktokApiInstance.post).toHaveBeenNthCalledWith(1, '/video/init/', expect.anything());
    // Verificar Upload (PUT global)
    expect(mockedAxios.put).toHaveBeenCalledWith('http://tiktok.upload', fileBuffer, expect.anything());
    // Verificar Status Check
    expect(mockTiktokApiInstance.post).toHaveBeenNthCalledWith(2, '/status/fetch/', { publish_id: 'pub_123' });
  });

  it('debe manejar error si falla el inicio de publicación', async () => {
    mockStorageService.read.mockResolvedValue(Buffer.from('data'));

    mockTiktokApiInstance.post.mockResolvedValueOnce({
      data: { error: { code: 'spam_risk', message: 'Spam detectado' } }
    });

    const result = await service.publish({ textContent: 'Fail', fileUrl: 'v.mp4' });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Spam detectado');
  });
});