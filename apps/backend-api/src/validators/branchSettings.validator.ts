
import { Request, Response, NextFunction } from 'express';

const isTime = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

const isValidTimezone = (value: string): boolean => {
  try {
    new Intl.DateTimeFormat('en-US', {
      timeZone: value,
    });
    return true;
  } catch {
    return false;
  }
};

const allowedFields = new Set([
  'timezone',
  'currency',
  'workingHours',
  'attendanceWindow',
]);

export function validateBranchSettings(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const body: unknown = req.body;

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    res.status(400).json({
      success: false,
      message: 'Settings must be provided as an object',
    });
    return;
  }

  const settings = body as Record<string, unknown>;
  const keys = Object.keys(settings);

  if (keys.length === 0) {
    res.status(400).json({
      success: false,
      message: 'At least one branch setting is required',
    });
    return;
  }

  const unknownFields = keys.filter(
    (key) => !allowedFields.has(key),
  );

  if (unknownFields.length > 0) {
    res.status(400).json({
      success: false,
      message: `Unknown settings field: ${unknownFields[0]}`,
    });
    return;
  }

  if (settings.timezone !== undefined) {
    if (
      typeof settings.timezone !== 'string' ||
      !settings.timezone.trim() ||
      !isValidTimezone(settings.timezone.trim())
    ) {
      res.status(400).json({
        success: false,
        message: 'A valid timezone is required',
      });
      return;
    }

    settings.timezone = settings.timezone.trim();
  }

  if (settings.currency !== undefined) {
    if (
      typeof settings.currency !== 'string' ||
      !/^[A-Z]{3}$/.test(settings.currency)
    ) {
      res.status(400).json({
        success: false,
        message: 'Currency must be a 3-letter uppercase code, e.g. INR',
      });
      return;
    }

    try {
      const supportedCurrencies: string[] = [
        ...new Set(
          (Intl as unknown as {
            supportedValuesOf?: (key: string) => string[];
          }).supportedValuesOf?.('currency') ?? [],
        ),
      ];

      if (
        supportedCurrencies.length > 0 &&
        !supportedCurrencies.includes(settings.currency)
      ) {
        res.status(400).json({
          success: false,
          message: 'Unsupported currency code',
        });
        return;
      }
    } catch {
      // Keep the three-letter format check if currency
      // enumeration is unavailable in the runtime.
    }
  }

  if (settings.workingHours !== undefined) {
    const hours = settings.workingHours;

    if (
      !hours ||
      typeof hours !== 'object' ||
      Array.isArray(hours)
    ) {
      res.status(400).json({
        success: false,
        message: 'Working hours must be an object',
      });
      return;
    }

    const workingHours = hours as Record<string, unknown>;

    if (
      Object.keys(workingHours).length !== 2 ||
      !Object.keys(workingHours).every(
      (key) => ['start', 'end'].includes(key),
      )||
      
      !isTime(workingHours.start) ||
      !isTime(workingHours.end) ||
      workingHours.start >= workingHours.end
    ) {
      res.status(400).json({
        success: false,
        message: 'Working hours must have valid start and end times',
      });
      return;
    }
  }

  if (settings.attendanceWindow !== undefined) {
    const window = settings.attendanceWindow;

    if (
      !window ||
      typeof window !== 'object' ||
      Array.isArray(window)
    ) {
      res.status(400).json({
        success: false,
        message: 'Attendance window must be an object',
      });
      return;
    }

    const attendanceWindow = window as Record<string, unknown>;

    const keys = [
      'checkInStart',
      'checkInEnd',
      'checkOutStart',
      'checkOutEnd',
    ];

    if (
      Object.keys(attendanceWindow).length !== keys.length ||
!Object.keys(attendanceWindow).every(
  (key) => keys.includes(key),
) ||
!Object.keys(attendanceWindow).every(
  (key) => keys.includes(key),
) ||
      keys.some((key) => !isTime(attendanceWindow[key])) ||
      (attendanceWindow.checkInStart as string) >=
        (attendanceWindow.checkInEnd as string) ||
      (attendanceWindow.checkOutStart as string) >=
        (attendanceWindow.checkOutEnd as string)
    ) {
      res.status(400).json({
        success: false,
        message: 'Attendance window contains invalid time values',
      });
      return;
    }
  }

  next();
}
