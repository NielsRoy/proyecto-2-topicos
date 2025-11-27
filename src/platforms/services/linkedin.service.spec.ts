import { Test, TestingModule } from '@nestjs/testing';
import { LinkedInService } from './linkedin.service';
import { HttpService } from '@nestjs/axios';
import { STORAGE_SERVICE } from '../../config/injection-tokens';
import { of } from 'rxjs';
import { CloudinaryStorageService } from '../../storage/services/cloudinary-storage.service';
import { Logger } from '@nestjs/common';

// 1. Definimos los Mocks
// Mock para Axios (HttpService)
const mockHttpService = {
  axiosRef: {
    post: jest.fn(), // "Espía" el método post
  },
};

// Mock para StorageService
const mockStorageService = {
  read: jest.fn(),
};

describe('LinkedInService', () => {
  let service: LinkedInService;
  let httpService: HttpService;
  let storageService: CloudinaryStorageService; // O el tipo de tu StorageService

  beforeEach(async () => {
    // 2. Configuramos el módulo de prueba (como si fuera un module de Nest)
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkedInService,
        {
          provide: HttpService,
          useValue: mockHttpService, // Inyectamos nuestro mock en lugar del real
        },
        {
          provide: STORAGE_SERVICE, // Usamos el token de inyección
          useValue: mockStorageService, // Inyectamos el mock de almacenamiento
        },
      ],
    })
    .compile();

    service = module.get<LinkedInService>(LinkedInService);
    httpService = module.get<HttpService>(HttpService);
    storageService = module.get(STORAGE_SERVICE);

    // Limpiamos los mocks antes de cada test para que no se mezclen los datos
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    
    // CASO 1: Publicación de solo texto
    it('debe publicar texto correctamente', async () => {
      // DATOS DE PRUEBA
      const publicationData = { textContent: 'Hola LinkedIn' };
      const mockResponse = {
        status: 201,
        headers: { 'x-restli-id': '12345' },
        data: { id: 'urn:li:share:12345' }
      };

      // CONFIGURAR EL MOCK (STUB)
      // Cuando se llame a axios.post, devuelve esto inmediatamente:
      (httpService.axiosRef.post as jest.Mock).mockResolvedValue(mockResponse);

      // EJECUCION
      const result = await service.publish(publicationData);

      // VERIFICACIONES (ASSERTIONS)
      expect(result.success).toBe(true);
      expect(result.platform).toBe('linkedin');
      // Verificamos que se llamó a axios.post con el cuerpo correcto para texto
      expect(httpService.axiosRef.post).toHaveBeenCalledWith(
        expect.stringContaining('/ugcPosts'), // URL
        expect.objectContaining({ // Body parcial
            specificContent: expect.objectContaining({
                "com.linkedin.ugc.ShareContent": expect.objectContaining({
                    shareCommentary: { text: 'Hola LinkedIn' }
                })
            })
        }), 
        expect.any(Object) // Config
      );
    });

    // CASO 2: Publicación con imagen (El flujo complejo)
    it('debe publicar texto con imagen correctamente (flujo de 3 pasos)', async () => {
      // DATOS DE PRUEBA
      const publicationData = { textContent: 'Hola con Foto', fileUrl: 'ruta/foto.jpg' };
      const mockFileBuffer = Buffer.from('fake-image-data');

      // Mocks de respuestas de LinkedIn para los 3 pasos
      const step1RegisterResponse = {
        data: {
          value: {
            uploadMechanism: {
              'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': {
                uploadUrl: 'https://upload.linkedin.com/fake',
              },
            },
            asset: 'urn:li:digitalmediaAsset:123',
          },
        },
      };

      const step2UploadResponse = { status: 200 }; // Respuesta al subir binario
      
      const step3CreatePostResponse = {
        status: 201,
        headers: { 'x-restli-id': '999' },
        data: { id: 'urn:li:share:999' }
      };

      // CONFIGURAR MOCKS
      // Storage service devuelve un buffer falso
      (storageService.read as jest.Mock).mockReturnValue(mockFileBuffer);
      
      // HttpService debe responder diferente cada vez que se llama (chaining)
      (httpService.axiosRef.post as jest.Mock)
        .mockResolvedValueOnce(step1RegisterResponse) // 1ra llamada: Registro
        .mockResolvedValueOnce(step2UploadResponse)   // 2da llamada: Subida Bytes
        .mockResolvedValueOnce(step3CreatePostResponse); // 3ra llamada: Crear Post

      // EJECUCION
      const result = await service.publish(publicationData);

      // VERIFICACIONES
      expect(storageService.read).toHaveBeenCalledWith('ruta/foto.jpg');
      expect(httpService.axiosRef.post).toHaveBeenCalledTimes(3); // Se debió llamar 3 veces a la API
      expect(result.success).toBe(true);
    });

    // CASO 3: Manejo de Errores
    it('debe manejar errores y retornar success: false', async () => {
      const publicationData = { textContent: 'Error test' };
      
      // Simulamos que Axios lanza un error
      const errorMock = new Error('Network Error');
      (httpService.axiosRef.post as jest.Mock).mockRejectedValue(errorMock);

      const result = await service.publish(publicationData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network Error');
    });
  });
});