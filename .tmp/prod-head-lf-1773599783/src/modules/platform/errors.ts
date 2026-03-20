export class DomainError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status = 400, code = "DOMAIN_ERROR") {
    super(message);
    this.name = "DomainError";
    this.status = status;
    this.code = code;
  }
}
