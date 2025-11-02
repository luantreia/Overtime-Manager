// Cliente: validación simple de ObjectId (24 hex chars)
export const isValidObjectId = (id?: string): boolean => {
  // Mongoose's Types.ObjectId.isValid accepts either:
  // - a 24-hex-character string, or
  // - a 12-byte string
  if (!id || typeof id !== 'string') return false;
  // 12-byte string (could be binary when produced by BSON)
  if (id.length === 12) return true;
  // 24 hex chars
  if (/^[a-fA-F0-9]{24}$/.test(id)) return true;
  return false;
};

export class InvalidObjectIdError extends Error {
  constructor(message = 'ID inválido (cliente)') {
    super(message);
    this.name = 'InvalidObjectIdError';
  }
}

export default isValidObjectId;
