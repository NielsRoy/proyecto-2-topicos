import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { InstagramService } from './instagram.service';
import { ContainerStatusCode } from '../interfaces/instagram.types';
import { PublicationData } from '../interfaces/publication-data.interface';

describe('InstagramService', () => {
  let service: InstagramService;
  
  const mockHttpService = {
    axiosRef: {
      post: jest.fn(),
      get: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InstagramService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<InstagramService>(InstagramService);
    // Reducimos el tiempo de espera del sleep para que los tests corran rápido
    jest.spyOn(service as any, 'sleep').mockResolvedValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe fallar si no hay URL de imagen', async () => {
    const result = await service.publish({ textContent: 'Sin foto' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('url de imagen es obligatoria');
  });

  it('debe realizar el flujo completo exitosamente', async () => {
    const data: PublicationData = { textContent: 'Caption', fileUrl: 'http://img.jpg' };

    // 1. Mock Crear Contenedor
    (mockHttpService.axiosRef.post as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({ status: 200, data: { id: 'container_123' } })
    );

    // 2. Mock Check Status (Simulamos que al primer intento ya está FINISHED)
    (mockHttpService.axiosRef.get as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({ status: 200, data: { status_code: ContainerStatusCode.FINISHED } })
    );

    // 3. Mock Publicar Contenedor
    (mockHttpService.axiosRef.post as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({ status: 200, data: { permalink: 'http://insta.com/p/123' } })
    );

    const result = await service.publish(data);

    expect(result).toEqual({
      success: true,
      platform: 'instagram',
      url: 'http://insta.com/p/123',
    });
    
    // Verificamos que se llamaron en orden
    expect(mockHttpService.axiosRef.post).toHaveBeenCalledTimes(2); // Crear y Publicar
    expect(mockHttpService.axiosRef.get).toHaveBeenCalledTimes(1);  // Chequear
  });

  it('debe fallar si el contenedor no se procesa (status != FINISHED)', async () => {
    const data: PublicationData = { textContent: 'Caption', fileUrl: 'http://img.jpg' };

    // 1. Crear OK
    (mockHttpService.axiosRef.post as jest.Mock).mockResolvedValueOnce({ status: 200, data: { id: 'c_1' } });
    
    // 2. Check Status devuelve ERROR constantemente (simulamos 1 llamada para el test)
    (mockHttpService.axiosRef.get as jest.Mock).mockResolvedValue({ 
      status: 200, data: { status_code: 'ERROR' } 
    });

    // Forzamos al servicio a pensar que ya hizo los reintentos o falla rápido
    // Nota: Como es un loop, mockear el return value constante hará que el loop corra hasta MAX_RETRIES
    
    const result = await service.publish(data);

    expect(result.success).toBe(false);
    expect(result.error).toContain('El contenedor no se acepto');
  });
});