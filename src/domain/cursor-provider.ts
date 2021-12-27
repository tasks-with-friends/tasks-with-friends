export interface CursorProvider<T> {
  getCursor(obj: T): string;
}
