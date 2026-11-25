/**
 * The envelope of every answer of the backend (`BaseResponse` in `tajweed-backend`).
 *
 * @typeParam T the type of `data`
 */
export interface BaseResponse<T> {
  /** Whether the call succeeded. */
  readonly success: boolean;
  /** `OK`, or the error code (`NOT_FOUND_AYAH` …) — codes never change name. */
  readonly code: string;
  /** A message in the request's language. */
  readonly message: string;
  /** The answer; `null` on an error. */
  readonly data: T;
}
