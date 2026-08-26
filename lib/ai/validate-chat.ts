import { GeminiInvalidResponseError } from "@/lib/ai/validate-analysis";
import {
  chatResponseSchema,
  groundingStatusSchema,
  sourceContextIndicatorSchema,
} from "@/lib/validation/schemas";
import { z } from "zod";

const chatModelOutputSchema = z.object({
  answer: z.string().min(1),
  groundingStatus: groundingStatusSchema,
  sourceContextIndicator: sourceContextIndicatorSchema,
  spokenText: z.string().min(1).optional(),
});

export function parseAndValidateChatModelOutput(rawText: string): z.infer<typeof chatModelOutputSchema> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new GeminiInvalidResponseError("malformed_json");
  }

  const result = chatModelOutputSchema.safeParse(parsed);
  if (!result.success) {
    throw new GeminiInvalidResponseError("incomplete_analysis");
  }

  return result.data;
}

export { chatResponseSchema };
