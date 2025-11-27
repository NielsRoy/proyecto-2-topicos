import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { LinkedInService } from './linkedin.service';
import { STORAGE_SERVICE } from '../../config/injection-tokens';

describe('LinkedInService', () => {
  let service: LinkedInService;
  
  const mockHttpService = {
    axiosRef: {
      post: jest.fn(),
    },
  };

  const mockStorageService = {
    read: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkedInService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: STORAGE_SERVICE, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<LinkedInService>(LinkedInService);
  });

  afterEach(() => jest.clearAllMocks());

  it('debe publicar solo texto', async () => {
    (mockHttpService.axiosRef.post as jest.Mock).mockResolvedValue({
      status: 201,
      headers: { 'x-restli-id': 'urn:li:share:123' },
      data: { id: 'share:123' },
    });

    const result = await service.publish({ textContent: 'Hola LinkedIn' });

    expect(result.success).toBe(true);
    expect(result.url).toContain('linkedin.com/feed/update/share:123');
    // Verifica que NO llamó a lógica de imagen
    expect(mockStorageService.read).not.toHaveBeenCalled();
  });

  it('debe publicar con imagen (flujo de 3 pasos)', async () => {
    const fileBuffer = Buffer.from('fake-image');
    mockStorageService.read.mockResolvedValue(fileBuffer);

    // 1. Register Upload response
    (mockHttpService.axiosRef.post as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        value: {
          uploadMechanism: {
            'com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest': { uploadUrl: 'http://upload.linkedin' }
          },
          asset: 'urn:li:asset:123'
        }
      }
    })
    // 2. Upload Binary response
    .mockResolvedValueOnce({ status: 200 })
    // 3. Create Post response
    .mockResolvedValueOnce({
      status: 201,
      headers: { 'x-restli-id': 'urn:li:share:999' },
      data: { id: 'share:999' }
    });

    const result = await service.publish({ textContent: 'Foto', fileUrl: 'path/to/img.png' });

    expect(mockStorageService.read).toHaveBeenCalledWith('path/to/img.png');
    expect(mockHttpService.axiosRef.post).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(true);
  });
});