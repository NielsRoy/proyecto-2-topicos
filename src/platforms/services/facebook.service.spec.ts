import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { FacebookService } from './facebook.service';
import { PublicationData } from '../interfaces/publication-data.interface';

describe('FacebookService', () => {
  let service: FacebookService;
  let httpService: HttpService;

  // Mock del HttpService para interceptar axiosRef
  const mockHttpService = {
    axiosRef: {
      post: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookService,
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<FacebookService>(FacebookService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('publish', () => {
    it('debe publicar texto exitosamente (Feed)', async () => {
      const data: PublicationData = { textContent: 'Hola Facebook', fileUrl: undefined };
      
      // Simulamos respuesta exitosa de Facebook API
      (mockHttpService.axiosRef.post as jest.Mock).mockResolvedValue({
        status: 200,
        data: { id: '123456_7890' },
      });

      const result = await service.publish(data);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        expect.stringContaining('/feed'),
        { message: 'Hola Facebook' },
        expect.anything()
      );
      expect(result).toEqual({
        success: true,
        platform: 'facebook',
        url: expect.stringContaining('123456_7890'),
      });
    });

    it('debe publicar imagen exitosamente (Photos)', async () => {
      const data: PublicationData = { textContent: 'Foto', fileUrl: 'http://img.com/a.jpg' };

      (mockHttpService.axiosRef.post as jest.Mock).mockResolvedValue({
        status: 200,
        data: { post_id: '99999' },
      });

      const result = await service.publish(data);

      expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
        expect.stringContaining('/photos'),
        expect.objectContaining({ url: 'http://img.com/a.jpg' }),
        expect.anything()
      );
      expect(result.success).toBe(true);
    });

    it('debe manejar errores de la API', async () => {
      const data: PublicationData = { textContent: 'Error' };
      const errorMessage = 'Request failed with status code 400';
      
      (mockHttpService.axiosRef.post as jest.Mock).mockRejectedValue({
        response: { status: 400, data: { error: 'Bad Request' } },
        message: errorMessage,
      });

      const result = await service.publish(data);

      expect(result).toEqual({
        success: false,
        platform: 'facebook',
        error: errorMessage,
      });
    });
  });
});