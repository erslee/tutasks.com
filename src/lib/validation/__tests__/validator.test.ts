import { z } from 'zod'
import { validateRequestBody, validateRequestQuery, sendValidationError } from '../validator'
import type { NextApiRequest, NextApiResponse } from 'next'

// Mock response object
const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
} as unknown as NextApiResponse

// Test schema
const testSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(0, 'Age must be positive'),
})

describe('Validation utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('validateRequestBody', () => {
    it('should return success for valid data', () => {
      const mockRequest = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
        },
  } as unknown as NextApiRequest

      const result = validateRequestBody(testSchema, mockRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
      })
      expect(result.error).toBeUndefined()
    })

    it('should return error for invalid data', () => {
      const mockRequest = {
        body: {
          name: '',
          email: 'invalid-email',
          age: -5,
        },
  } as unknown as NextApiRequest

      const result = validateRequestBody(testSchema, mockRequest)

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(result.error).toContain('name:')
      expect(result.error).toContain('email:')
      expect(result.error).toContain('age:')
    })

    it('should return error for missing required fields', () => {
      const mockRequest = {
        body: {},
  } as unknown as NextApiRequest

      const result = validateRequestBody(testSchema, mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error).toContain('name:')
      expect(result.error).toContain('email:') 
      expect(result.error).toContain('age:')
    })

    it('should handle non-ZodError exceptions', () => {
  const mockSchema = {
        parse: jest.fn().mockImplementation(() => {
          throw new Error('Generic error')
        }),
  } as unknown as z.ZodSchema<unknown>

      const mockRequest = {
        body: { test: 'data' },
  } as unknown as NextApiRequest

      const result = validateRequestBody(mockSchema, mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid request body')
    })
  })

  describe('validateRequestQuery', () => {
    const querySchema = z.object({
      id: z.string().min(1, 'ID is required'),
      page: z.string().optional(),
    })

    it('should return success for valid query params', () => {
      const mockRequest = {
        query: {
          id: '123',
          page: '1',
        },
  } as unknown as NextApiRequest

      const result = validateRequestQuery(querySchema, mockRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: '123',
        page: '1',
      })
    })

    it('should return error for invalid query params', () => {
      const mockRequest = {
        query: {
          id: '',
        },
  } as unknown as NextApiRequest

      const result = validateRequestQuery(querySchema, mockRequest)

      expect(result.success).toBe(false)
      expect(result.error).toContain('id:')
    })

    it('should handle optional query params', () => {
      const mockRequest = {
        query: {
          id: '123',
        },
  } as unknown as NextApiRequest

      const result = validateRequestQuery(querySchema, mockRequest)

      expect(result.success).toBe(true)
      expect(result.data).toEqual({
        id: '123',
      })
    })
  })

  describe('sendValidationError', () => {
    it('should send 400 status with error message', () => {
      const errorMessage = 'Validation failed'
      
      sendValidationError(mockResponse, errorMessage)

      expect(mockResponse.status).toHaveBeenCalledWith(400)
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error: Validation failed',
      })
    })

    it('should prefix error message correctly', () => {
      const errorMessage = 'Name is required, Email is invalid'
      
      sendValidationError(mockResponse, errorMessage)

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation error: Name is required, Email is invalid',
      })
    })
  })
})
