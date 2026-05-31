/**
 * Data API wrapper — disabled. Previously used Manus forge API.
 * Kept as stub for compatibility. Re-implement with direct APIs as needed.
 */

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  _apiId: string,
  _options: DataApiCallOptions = {},
): Promise<unknown> {
  throw new Error("Data API via Manus forge is no longer available. Use direct API calls instead.");
}
