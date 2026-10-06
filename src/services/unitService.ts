import { api } from './api';

export interface UnitDTO {
  id: number;
  uuid: string;
  code: string;
  name: string;
}

/**
 * O'lchov birliklari. Backend'da `units` resursi hujjatlashtirilmagan
 * bo'lsa ham, `products` endpointi `unit_id` qabul qiladi. Bu yordamchi
 * mavjud birliklarni olib keladi; mavjud bo'lmasa bo'sh ro'yxat qaytaradi.
 */
export const unitService = {
  async list(): Promise<UnitDTO[]> {
    try {
      const res = (await api.get('/units')) as unknown as {
        data: UnitDTO[] | { items: UnitDTO[] };
      };
      const data = res.data;
      return Array.isArray(data) ? data : data.items;
    } catch {
      return [];
    }
  },
};
