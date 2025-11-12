export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const isHttpError = (error: unknown): error is HttpError => {
  return Boolean(error) && typeof error === "object" && "status" in (error as Record<string, unknown>);
};

