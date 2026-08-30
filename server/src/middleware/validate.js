import { ApiError } from '../utils/apiResponse.js';

// Usage: router.post('/', validate(createItemSchema), controller.create)
// Validates req.body against a Zod schema and replaces it with the parsed
// (and type-coerced) result, so controllers can trust the shape of req.body.
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new ApiError(400, 'Validation failed', result.error.flatten());
    }
    req.body = result.data;
    next();
  };
}
