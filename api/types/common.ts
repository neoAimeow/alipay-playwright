export interface BaseResult<T> {
  code: number;
  data: T;
  message: string;
}
