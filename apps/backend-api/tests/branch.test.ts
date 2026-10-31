
import { Request, Response, NextFunction } from 'express';

import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  updateBranchStatus,
} from '../src/services/branch.service';

import {
  getBranchesHandler,
  getBranchByIdHandler,
  createBranchHandler,
  updateBranchHandler,
  updateBranchStatusHandler,
} from '../src/controllers/branch.controller';

import {
  validateCreateBranch,
  validateUpdateBranch,
  validateBranchStatus,
} from '../src/validators/branch.validator';

jest.mock('../src/services/branch.service', () => ({
  createBranch: jest.fn(),
  getBranches: jest.fn(),
  getBranchById: jest.fn(),
  updateBranch: jest.fn(),
  updateBranchStatus: jest.fn(),
}));

const mockCreateBranch = createBranch as jest.MockedFunction<
  typeof createBranch
>;
const mockGetBranches = getBranches as jest.MockedFunction<
  typeof getBranches
>;
const mockGetBranchById = getBranchById as jest.MockedFunction<
  typeof getBranchById
>;
const mockUpdateBranch = updateBranch as jest.MockedFunction<
  typeof updateBranch
>;
const mockUpdateBranchStatus =
  updateBranchStatus as jest.MockedFunction<
    typeof updateBranchStatus
  >;

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

function createRequest(overrides: Record<string, any> = {}) {
  return {
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function validBranchData() {
  return {
    name: 'Noida Branch',
    code: 'NOIDA01',
    address: 'Sector 63',
    city: 'Noida',
    state: 'Uttar Pradesh',
    phone: '9876543210',
    email: 'branch@example.com',
    managerName: 'Branch Manager',
    gstNumber: '09AAACB2894G1Z5',
  };
}

describe('Branch Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBranchesHandler', () => {
    it('should return branches with pagination', async () => {
      mockGetBranches.mockResolvedValue({
        data: [{ name: 'Noida Branch', code: 'NOIDA01' }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      } as Awaited<ReturnType<typeof getBranches>>);

      const req = createRequest({
        query: {
          page: '1',
          limit: '10',
          search: 'Noida',
          status: 'active',
        },
      });

      const res = createResponse();

      await getBranchesHandler(req, res);

      expect(mockGetBranches).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'Noida',
        status: 'active',
      });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Branches fetched successfully',
          data: expect.any(Array),
          pagination: expect.any(Object),
        }),
      );
    });

    it('should use default pagination and status values', async () => {
      mockGetBranches.mockResolvedValue({
        data: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      } as Awaited<ReturnType<typeof getBranches>>);

      const req = createRequest();
      const res = createResponse();

      await getBranchesHandler(req, res);

      expect(mockGetBranches).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: '',
        status: 'all',
      });

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return an error when fetching branches fails', async () => {
      mockGetBranches.mockRejectedValue(
        Object.assign(new Error('Database error'), {
          statusCode: 500,
        }),
      );

      const res = createResponse();

      await getBranchesHandler(createRequest(), res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database error',
      });
    });
  });

  describe('getBranchByIdHandler', () => {
    it('should reject a missing branch ID', async () => {
      const res = createResponse();

      await getBranchByIdHandler(
        createRequest() as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockGetBranchById).not.toHaveBeenCalled();
    });

    it('should return a branch when found', async () => {
      const branch = {
        _id: '507f1f77bcf86cd799439011',
        name: 'Noida Branch',
        code: 'NOIDA01',
      };

      mockGetBranchById.mockResolvedValue(
        branch as unknown as Awaited<ReturnType<typeof getBranchById>>,
      );

      const res = createResponse();

      await getBranchByIdHandler(
        createRequest({
          params: { id: branch._id },
        }) as any,
        res,
      );

      expect(mockGetBranchById).toHaveBeenCalledWith(branch._id);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Branch fetched successfully',
        data: branch,
      });
    });

    it('should return the service error status', async () => {
      mockGetBranchById.mockRejectedValue(
        Object.assign(new Error('Branch not found'), {
          statusCode: 404,
        }),
      );

      const res = createResponse();

      await getBranchByIdHandler(
        createRequest({
          params: { id: '507f1f77bcf86cd799439011' },
        }) as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Branch not found',
      });
    });
  });

  describe('createBranchHandler', () => {
    it('should create a branch and return 201', async () => {
      const branchData = validBranchData();
      const savedBranch = {
        _id: '507f1f77bcf86cd799439011',
        ...branchData,
      };

      mockCreateBranch.mockResolvedValue(
        savedBranch as unknown as Awaited<ReturnType<typeof createBranch>>,
      );

      const res = createResponse();

      await createBranchHandler(
        createRequest({ body: branchData }) as any,
        res,
      );

      expect(mockCreateBranch).toHaveBeenCalledWith(branchData);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Branch created successfully',
        data: savedBranch,
      });
    });

    it('should return a conflict when the branch code already exists', async () => {
      mockCreateBranch.mockRejectedValue(
        Object.assign(
          new Error('A branch with this code already exists'),
          { statusCode: 409 },
        ),
      );

      const res = createResponse();

      await createBranchHandler(
        createRequest({ body: validBranchData() }) as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'A branch with this code already exists',
      });
    });
  });

  describe('updateBranchHandler', () => {
    it('should reject a missing branch ID', async () => {
      const res = createResponse();

      await updateBranchHandler(createRequest() as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockUpdateBranch).not.toHaveBeenCalled();
    });

    it('should update a branch successfully', async () => {
      const branchId = '507f1f77bcf86cd799439011';
      const updates = { city: 'Ghaziabad' };
      const updatedBranch = {
        _id: branchId,
        name: 'Noida Branch',
        city: 'Ghaziabad',
      };

      mockUpdateBranch.mockResolvedValue(
        updatedBranch as unknown as Awaited<ReturnType<typeof updateBranch>>,
      );

      const res = createResponse();

      await updateBranchHandler(
        createRequest({
          params: { id: branchId },
          body: updates,
        }) as any,
        res,
      );

      expect(mockUpdateBranch).toHaveBeenCalledWith(
        branchId,
        updates,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Branch updated successfully',
        data: updatedBranch,
      });
    });
  });

  describe('updateBranchStatusHandler', () => {
    it('should deactivate a branch successfully', async () => {
      const branchId = '507f1f77bcf86cd799439011';
      const branch = {
        _id: branchId,
        name: 'Noida Branch',
        isActive: false,
      };

      mockUpdateBranchStatus.mockResolvedValue(
       branch as unknown as Awaited<
  ReturnType<typeof updateBranchStatus>
>,
      );

      const res = createResponse();

      await updateBranchStatusHandler(
        createRequest({
          params: { id: branchId },
          body: { isActive: false },
        }) as any,
        res,
      );

      expect(mockUpdateBranchStatus).toHaveBeenCalledWith(
        branchId,
        false,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Branch deactivated successfully',
        data: branch,
      });
    });

    it('should activate a branch successfully', async () => {
      const branchId = '507f1f77bcf86cd799439011';

     mockUpdateBranchStatus.mockResolvedValue({
  _id: branchId,
  isActive: true,
} as unknown as Awaited<ReturnType<typeof updateBranchStatus>>);

      const res = createResponse();

      await updateBranchStatusHandler(
        createRequest({
          params: { id: branchId },
          body: { isActive: true },
        }) as any,
        res,
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Branch activated successfully',
        }),
      );
    });
  });
});

describe('Branch Validators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateCreateBranch', () => {
    it('should allow valid branch data', () => {
      const req = createRequest({
        body: validBranchData(),
      });
      const res = createResponse();
      const next = createNext();

      validateCreateBranch(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject a missing branch name', () => {
      const data = validBranchData();
      const { name, ...body } = data;

      const res = createResponse();
      const next = createNext();

      validateCreateBranch(
        createRequest({ body }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Branch name is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject a missing branch code', () => {
      const data = validBranchData();
      const { code, ...body } = data;

      const res = createResponse();
      const next = createNext();

      validateCreateBranch(
        createRequest({ body }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Branch code is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject a branch code longer than 30 characters', () => {
      const res = createResponse();
      const next = createNext();

      validateCreateBranch(
        createRequest({
          body: {
            ...validBranchData(),
            code: 'A'.repeat(31),
          },
        }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Branch code cannot exceed 30 characters',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject an invalid email', () => {
      const res = createResponse();
      const next = createNext();

      validateCreateBranch(
        createRequest({
          body: {
            ...validBranchData(),
            email: 'not-an-email',
          },
        }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid email address',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject an invalid GST number', () => {
      const res = createResponse();
      const next = createNext();

      validateCreateBranch(
        createRequest({
          body: {
            ...validBranchData(),
            gstNumber: 'INVALID-GST',
          },
        }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid GST number format',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject an invalid manager ID', () => {
      const res = createResponse();
      const next = createNext();

      validateCreateBranch(
        createRequest({
          body: {
            ...validBranchData(),
            managerId: 'invalid-id',
          },
        }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid manager ID',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateUpdateBranch', () => {
    it('should allow a valid partial update', () => {
      const res = createResponse();
      const next = createNext();

      validateUpdateBranch(
        createRequest({
          body: { city: 'Meerut' },
        }) as any,
        res,
        next,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject an empty update', () => {
      const res = createResponse();
      const next = createNext();

      validateUpdateBranch(
        createRequest({ body: {} }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'At least one branch field is required',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject an empty branch name', () => {
      const res = createResponse();
      const next = createNext();

      validateUpdateBranch(
        createRequest({
          body: { name: '   ' },
        }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Branch name cannot be empty',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should reject a non-string address', () => {
      const res = createResponse();
      const next = createNext();

      validateUpdateBranch(
        createRequest({
          body: { address: 123 },
        }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'address must be a string',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateBranchStatus', () => {
    it('should allow a boolean isActive value', () => {
      const res = createResponse();
      const next = createNext();

      validateBranchStatus(
        createRequest({
          body: { isActive: true },
        }) as any,
        res,
        next,
      );

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should reject a string isActive value', () => {
      const res = createResponse();
      const next = createNext();

      validateBranchStatus(
        createRequest({
          body: { isActive: 'true' },
        }) as any,
        res,
        next,
      );

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'isActive must be true or false',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
