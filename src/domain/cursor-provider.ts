export interface CursorProvider<T> {
  getCursor(obj: T | null | undefined): string;
}
