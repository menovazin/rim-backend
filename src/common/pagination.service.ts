import { Injectable } from '@nestjs/common';

export interface PaginationInfo {
  count: number;
  pages: number;
  next: string | null;
  prev: string | null;
}

const PAGE_SIZE = 20;

@Injectable()
export class PaginationService {
  calculatePagination(
    page: number,
    total: number,
    baseUrl: string,
    protocol: string = 'https',
  ): PaginationInfo {
    const pages = Math.ceil(total / PAGE_SIZE);

    return {
      count: total,
      pages,
      next:
        page < pages
          ? `${protocol}://${baseUrl}?page=${page + 1}`
          : null,
      prev: page > 1 ? `${protocol}://${baseUrl}?page=${page - 1}` : null,
    };
  }

  readonly PAGE_SIZE = PAGE_SIZE;
}
