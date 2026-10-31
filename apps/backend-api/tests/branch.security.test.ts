
import request from 'supertest';
import app from '../src/app';

import { User } from '../src/models/User.model';
import { Branch } from '../src/models/Branch.model';
import { verifyAccessToken } from '../src/utils/jwt';

import {
  getBranchesHandler,
  createBranchHandler,
} from '../src/controllers/branch.controller';

import {
  getBranchSettingsHandler,
  updateBranchSettingsHandler,
} from '../src/controllers/branchSettings.controller';

jest.mock('../src/utils/jwt', () => ({
  verifyAccessToken: jest.fn(),
}));

jest.mock('../src/models/User.model', () => ({
  User: {
    findById: jest.fn(),
  },
}));

jest.mock('../src/models/Branch.model', () => ({
  Branch: {
    findById: jest.fn(),
  },
}));


jest.mock('../src/controllers/branch.controller', () => ({
  createBranchHandler: jest.fn((_req: any, res: any) =>
    res.status(200).json({ success: true, handler: 'createBranch' }),
  ),
  getBranchByIdHandler: jest.fn((_req: any, res: any) =>
    res.status(200).json({ success: true, handler: 'getBranchById' }),
  ),
  getBranchesHandler: jest.fn((_req: any, res: any) =>
    res.status(200).json({ success: true, handler: 'getBranches' }),
  ),
  getAvailableBranchesForManagerHandler: jest.fn(
    (_req: any, res: any) =>
      res.status(200).json({
        success: true,
        handler: 'getAvailableBranchesForManager',
      }),
  ),
  updateBranchHandler: jest.fn((_req: any, res: any) =>
    res.status(200).json({ success: true, handler: 'updateBranch' }),
  ),
  updateBranchStatusHandler: jest.fn((_req: any, res: any) =>
    res.status(200).json({ success: true, handler: 'updateBranchStatus' }),
  ),
}));


jest.mock('../src/controllers/branchSettings.controller', () => ({
  getBranchSettingsHandler: jest.fn((_req: any, res: any) =>
    res.status(200).json({ success: true, handler: 'getBranchSettings' }),
  ),
  updateBranchSettingsHandler: jest.fn((_req: any, res: any) =>
    res.status(200).json({ success: true, handler: 'updateBranchSettings' }),
  ),
}));

const mockedVerifyAccessToken = verifyAccessToken as jest.Mock;
const mockedUserFindById = User.findById as jest.Mock;
const mockedBranchFindById = Branch.findById as jest.Mock;

const mockUser = (user: any) => {
  mockedUserFindById.mockReturnValue({
    select: jest.fn().mockResolvedValue(user),
  });
};

const mockActiveBranch = () => {
  mockedBranchFindById.mockReturnValue({
    select: jest.fn().mockResolvedValue({
      _id: 'branch-1',
      isActive: true,
    }),
  });
};

describe('Branch API security', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedVerifyAccessToken.mockImplementation((token: string) => {
      if (token === 'invalid-token') {
        throw new Error('Invalid token');
      }

      return {
        userId: token === 'admin-token' ? 'admin-1' : 'employee-1',
      };
    });

    mockedUserFindById.mockImplementation((id: string) => ({
      select: jest.fn().mockResolvedValue(
        id === 'admin-1'
          ? {
              _id: 'admin-1',
              role: 'SUPER_ADMIN',
              branchId: undefined,
              isActive: true,
            }
          : {
              _id: 'employee-1',
              role: 'MEMBER',
              branchId: 'branch-1',
              isActive: true,
            },
      ),
    }));

    mockActiveBranch();
  });

  it('rejects requests without a token', async () => {
    const response = await request(app).get('/api/branches');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('rejects an invalid token', async () => {
    const response = await request(app)
      .get('/api/branches')
      .set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid or expired token');
  });

  it('blocks a MEMBER from branch APIs', async () => {
    const response = await request(app)
      .get('/api/branches')
      .set('Authorization', 'Bearer employee-token');

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Insufficient permissions');
  });

  it('allows a SUPER_ADMIN to reach the branch list handler', async () => {
    const response = await request(app)
      .get('/api/branches')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('getBranches');
    expect(getBranchesHandler).toHaveBeenCalled();
  });

  it('blocks a MEMBER from reading branch settings', async () => {
    const response = await request(app)
      .get('/api/branches/branch-1/settings')
      .set('Authorization', 'Bearer employee-token');

    expect(response.status).toBe(403);
    expect(getBranchSettingsHandler).not.toHaveBeenCalled();
  });

  it('blocks a MEMBER from updating branch settings', async () => {
    const response = await request(app)
      .put('/api/branches/branch-1/settings')
      .set('Authorization', 'Bearer employee-token')
      .send({
        timezone: 'Asia/Kolkata',
      });

    expect(response.status).toBe(403);
    expect(updateBranchSettingsHandler).not.toHaveBeenCalled();
  });

  it('allows a SUPER_ADMIN to reach the branch settings handler', async () => {
    const response = await request(app)
      .get('/api/branches/branch-1/settings')
      .set('Authorization', 'Bearer admin-token');

    expect(response.status).toBe(200);
    expect(response.body.handler).toBe('getBranchSettings');
    expect(getBranchSettingsHandler).toHaveBeenCalled();
  });
});
