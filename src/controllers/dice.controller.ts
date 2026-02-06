import { Request, Response, NextFunction } from "express";
import { DiceService } from "../services/dice.service";
import { AdvantageMode } from "../types";

const diceService = new DiceService();

export const rollDice = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { expression, advantageMode } = req.body;

    if (!expression || typeof expression !== "string") {
      return res.status(400).json({
        error: "ValidationError",
        message: "Expression is required and must be a string",
        details: [],
        timestamp: new Date().toISOString(),
      });
    }

    // Validate advantageMode if provided
    let mode = AdvantageMode.NONE;
    if (advantageMode) {
      if (!Object.values(AdvantageMode).includes(advantageMode)) {
        return res.status(400).json({
          error: "ValidationError",
          message: `Invalid advantageMode. Must be one of: ${Object.values(AdvantageMode).join(", ")}`,
          details: [],
          timestamp: new Date().toISOString(),
        });
      }
      mode = advantageMode as AdvantageMode;
    }

    const result = diceService.roll(expression, mode);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const healthCheck = (_req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
};
