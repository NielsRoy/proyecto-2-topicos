import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { WhatsappService } from './whatsapp.service';

describe('WhatsappService', () => {
  let service: WhatsappService;

  const mockHttpService = {
    axiosRef: {
      post: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
  });

  it('debe fallar si falta la URL de la imagen', async () => {
    const result = await service.publish({ textContent: 'Hola' });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('debe publicar historia exitosamente', async () => {
    (mockHttpService.axiosRef.post as jest.Mock).mockResolvedValue({
      status: 200,
      data: { sent: true },
    });

    const result = await service.publish({ textContent: 'Hola', fileUrl: 'http://img.com' });

    expect(result.success).toBe(true);
    expect(mockHttpService.axiosRef.post).toHaveBeenCalledWith(
      expect.stringContaining('/stories/send/media'),
      expect.objectContaining({ media: 'http://img.com' }),
      expect.anything()
    );
  });
});