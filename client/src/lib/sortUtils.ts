// /lib/sortUtils.ts
import { ImageProps } from "../Components/Image";

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
  images: ImageProps[],
  sortBy: SortBy = SortBy.DATE, //fecha por orden descendente, el orden por defecto
  sortOrder: SortOrder = SortOrder.DESC
): ImageProps[] {
  return [...images].sort((a, b) => {
    const compareValue =
      sortBy === SortBy.HINT
        ? a.hint.localeCompare(b.hint)
        : new Date(a.date).getTime() - new Date(b.date).getTime();
    return sortOrder === SortOrder.ASC ? compareValue : -compareValue;
  });
}
