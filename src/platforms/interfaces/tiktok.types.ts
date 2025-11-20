// Interfaces actualizadas
export interface TikTokInitResponse {
  data: {
    publish_id: string;
    upload_url: string; // <--- TikTok nos devolverá esto para subir el archivo
  };
  error: {
    code: string;
    message: string;
    log_id: string;
  };
}

export interface TikTokStatusResponse {
  data: {
    status: 'PROCESSING_UPLOAD' | 'PROCESSING_AUDIT' | 'FAILED' | 'PUBLISH_COMPLETE';
    fail_reason?: string;
    publicly_available_post_id?: string[];
  };
}