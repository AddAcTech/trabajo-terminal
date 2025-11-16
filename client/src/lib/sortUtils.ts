// /lib/sortUtils.ts
import { ImageProps } from "../Components/Image";

export enum SortBy {
  HINT = "hint",
  DATE = "date",
  SIZE = "size",
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
  bytes: number;
}

export function sortImages(
  images: ImageProps[],
  sortBy: SortBy = SortBy.DATE, //fecha por orden descendente, el orden por defecto
  sortOrder: SortOrder = SortOrder.DESC
): ImageProps[] {
  return [...images].sort((a, b) => {
    const compareValue =
      sortBy === SortBy.HINT //hint = titulo
        ? a.hint.localeCompare(b.hint)
        : sortBy === SortBy.SIZE //tamaño
          ? a.bytes - b.bytes
          :new Date(a.date).getTime() - new Date(b.date).getTime(); //fecha
    return sortOrder === SortOrder.ASC ? compareValue : -compareValue;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}