import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";

/** Validates req.body/query/params against a Zod schema shaped as { body, query, params }. */
export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = parsed.body ?? req.body;
      if (parsed.query) Object.assign(req.query, parsed.query);
      if (parsed.params) Object.assign(req.params, parsed.params);
      next();
    } catch (err) {
      next(err); // ZodError is handled by globalErrorHandler
    }
  };
}
