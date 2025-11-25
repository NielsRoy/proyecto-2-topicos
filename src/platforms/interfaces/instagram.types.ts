export interface CreateContainerResponse {
  id: string;
}

export interface CreateContainerRequest {
  caption: string;
  image_url: string;
}

export interface PublishContainerRequest {
  creation_id: string;
}

export interface PublishContainerResponse {
  id: string;
  permalink: string;
}

//https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-container#campos
export enum ContainerStatusCode {
  EXPIRED = 'EXPIRED',  //el contenedor no se publicó en las últimas 24 horas y caducó.
  ERROR = 'ERROR',  //el contenedor no completó el proceso de publicación.
  FINISHED = 'FINISHED', //el contenedor y su objeto multimedia están listos para la publicación.
  IN_PROGRESS = 'IN_PROGRESS',  //el contenedor todavía está atravesando el proceso de publicación.
  PUBLISHED = 'PUBLISHED',  //se publicó el objeto multimedia del contenedor.
}

export interface ContainerStatusResponse {
  id: string;
  status: string; //Si status_code es ERROR, este valor será un subcódigo de error.
  status_code: ContainerStatusCode;  
}
//subcodigos de error:
//https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes