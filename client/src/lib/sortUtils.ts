// /lib/sortUtils.ts

export enum SortBy {
  HINT = "hint",
  DATE = "date",
}

export enum SortOrder {
  ASC = "asc",
  DESC = "desc",
}

export interface ImageData {
  image: string;
  hint: string;
  date: string;
  extraCols: number;
  extraRows: number;
}

export function sortImages(
  images: ImageData[],
  sortBy: SortBy = SortBy.HINT,
  sortOrder: SortOrder = SortOrder.ASC
): ImageData[] {
  return [...images].sort((a, b) => {
    let valueA : string | Date; //string si es el título, date si es la fecha de publicación
    let valueB : string | Date;
    valueA = a[sortBy];
    valueB = b[sortBy];

    if (sortBy === SortBy.DATE) {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }

    if (valueA < valueB) return sortOrder === SortOrder.ASC ? -1 : 1;
    if (valueA > valueB) return sortOrder === SortOrder.ASC ? 1 : -1;
    return 0;
  });
}
