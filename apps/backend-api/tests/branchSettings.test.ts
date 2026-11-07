import { Request, Response, NextFunction } from 'express';
import { validateBranchSettings } from '../src/validators/branchSettings.validator';

function createResponse() {
  const res: any = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res as Response & {
    status: jest.Mock;
    json: jest.Mock;
  };
}

function createNext() {
  return jest.fn() as jest.MockedFunction<NextFunction>;
}

function createRequest(body: unknown = {}): Request {
  return { body } as Request;
}

describe('Branch Settings Validator', () => {
  it('accepts valid settings', () => {
    const req = createRequest({
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      workingHours: { start: '09:00', end: '18:00' },
      attendanceWindow: {
        checkInStart: '08:00',
        checkInEnd: '11:00',
        checkOutStart: '16:00',
        checkOutEnd: '23:00',
      },
    });

    const res = createResponse();
    const next = createNext();

    validateBranchSettings(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects an empty settings object', () => {
    const res = createResponse();
    const next = createNext();

    validateBranchSettings(createRequest({}), res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a non-object body', () => {
    const res = createResponse();
    const next = createNext();

    validateBranchSettings(createRequest('invalid'), res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid timezone', () => {
    const res = createResponse();
    const next = createNext();

    validateBranchSettings(
      createRequest({ timezone: 'Invalid/Zone' }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid currency format', () => {
    const res = createResponse();
    const next = createNext();

    validateBranchSettings(
      createRequest({ currency: 'inr' }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects invalid working hours', () => {
    const res = createResponse();
    const next = createNext();

    validateBranchSettings(
      createRequest({
        workingHours: { start: '18:00', end: '09:00' },
      }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid attendance window', () => {
    const res = createResponse();
    const next = createNext();

    validateBranchSettings(
      createRequest({
        attendanceWindow: {
          checkInStart: '11:00',
          checkInEnd: '08:00',
          checkOutStart: '16:00',
          checkOutEnd: '23:00',
        },
      }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects unknown settings fields', () => {
    const res = createResponse();
    const next = createNext();

    validateBranchSettings(
      createRequest({ randomSetting: true }),
      res,
      next,
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});
