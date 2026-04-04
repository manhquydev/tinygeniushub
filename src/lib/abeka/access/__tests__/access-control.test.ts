import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  PackageAccessControl,
  getPackageMapping,
  getAccessibleGradeLevels,
  isGradeAccessible,
  gradeLevelToName,
  gradeNameToLevel,
  PACKAGE_GRADE_MAPPINGS,
} from '../access-control';
import { PlanCode, SubscriptionStatus } from '@prisma/client';

// Create mock functions
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockQueryRawUnsafe = vi.fn();

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    childProfile: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
    },
    subscription: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
    },
    $queryRawUnsafe: (...args: any[]) => mockQueryRawUnsafe(...args),
  },
}));

describe('PackageAccessControl', () => {
  let accessControl: PackageAccessControl;
  
  const mockParentId = 'parent_123';
  const mockChildId = 'child_456';
  
  beforeEach(() => {
    accessControl = new PackageAccessControl();
    vi.clearAllMocks();
  });
  
  describe('canAccessVideo', () => {
    it('should deny access when child does not belong to user', async () => {
      mockFindFirst.mockResolvedValue(null);
      
      const result = await accessControl.canAccessVideo(
        mockParentId,
        mockChildId,
        '2' // G1
      );
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('Child profile not found');
    });
    
    it('should deny access when no subscription exists', async () => {
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue(null);
      
      const result = await accessControl.canAccessVideo(
        mockParentId,
        mockChildId,
        '2' // G1
      );
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('No active subscription');
    });
    
    it('should deny access when subscription status is EXPIRED', async () => {
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.EXPIRED,
        currentPeriodEnd: new Date('2024-01-01'),
      });
      
      const result = await accessControl.canAccessVideo(
        mockParentId,
        mockChildId,
        '2' // G1
      );
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('EXPIRED');
    });
    
    it('should deny access when subscription period has ended', async () => {
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: new Date('2024-01-01'), // Past date
      });
      
      const result = await accessControl.canAccessVideo(
        mockParentId,
        mockChildId,
        '2' // G1
      );
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('expired');
    });
    
    it('should deny access when grade is outside package range', async () => {
      // Set current date to future so subscription is valid
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD, // K4-G5 (levels 0-5)
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: futureDate,
      });
      
      // G6 is level 7, outside MONTHLY_STANDARD range
      const result = await accessControl.canAccessVideo(
        mockParentId,
        mockChildId,
        '7' // G6
      );
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('nâng cấp gói');
    });
    
    it('should allow access when grade is within package range', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD, // K4-G5 (levels 0-5)
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: futureDate,
      });
      
      // G1 is level 2, within MONTHLY_STANDARD range
      const result = await accessControl.canAccessVideo(
        mockParentId,
        mockChildId,
        '2' // G1
      );
      
      expect(result.hasAccess).toBe(true);
      expect(result.accessibleGrades).toContain(2);
    });
    
    it('should allow access for YEARLY_FAMILY_PLUS to all grades', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.YEARLY_FAMILY_PLUS, // K4-G12 (levels 0-13)
        status: SubscriptionStatus.ACTIVE_FAMILYPLUS,
        currentPeriodEnd: futureDate,
      });
      
      // Should allow G12 (level 13)
      const result = await accessControl.canAccessVideo(
        mockParentId,
        mockChildId,
        '13' // G12
      );
      
      expect(result.hasAccess).toBe(true);
    });
    
    it('should handle grade name formats (K4, K5, G1, etc.)', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: futureDate,
      });
      
      const result = await accessControl.canAccessVideo(
        mockParentId,
        mockChildId,
        'G1' // Should convert to level 2
      );
      
      expect(result.hasAccess).toBe(true);
    });
  });
  
  describe('getAccessibleGrades', () => {
    it('should return empty array when subscription is invalid', async () => {
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue(null);
      
      const grades = await accessControl.getAccessibleGrades(mockParentId, mockChildId);
      
      expect(grades).toEqual([]);
    });
    
    it('should return correct grades for TRIAL plan', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.TRIAL,
        status: SubscriptionStatus.TRIALING,
        currentPeriodEnd: futureDate,
      });
      
      const grades = await accessControl.getAccessibleGrades(mockParentId, mockChildId);
      
      // TRIAL: K4, K5, G1 (levels 0, 1, 2)
      expect(grades).toEqual(['0', '1', '2']);
    });
    
    it('should return correct grades for MONTHLY_STANDARD plan', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: futureDate,
      });
      
      const grades = await accessControl.getAccessibleGrades(mockParentId, mockChildId);
      
      // MONTHLY_STANDARD: K4-G5 (levels 0-5)
      expect(grades).toEqual(['0', '1', '2', '3', '4', '5']);
    });
    
    it('should throw error when child does not belong to parent', async () => {
      mockFindFirst.mockResolvedValue(null);
      
      await expect(
        accessControl.getAccessibleGrades(mockParentId, mockChildId)
      ).rejects.toThrow('Child profile not found');
    });
  });
  
  describe('getAccessibleVideos', () => {
    it('should return paginated videos within accessible grades', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      const mockVideos = [
        { id: 'video1', gradeLevel: 2, title: 'Phonics 1' },
        { id: 'video2', gradeLevel: 3, title: 'Math 1' },
      ];
      
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: futureDate,
      });
      
      // Mock raw query results
      mockQueryRawUnsafe.mockResolvedValueOnce(mockVideos); // Videos query
      mockQueryRawUnsafe.mockResolvedValueOnce([{ count: 10 }]); // Count query
      
      const result = await accessControl.getAccessibleVideos(
        mockParentId,
        mockChildId,
        { page: 1, limit: 20 }
      );
      
      expect(result.videos).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.page).toBe(1);
    });
    
    it('should return empty result for inaccessible grade', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD, // Max grade 5
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: futureDate,
      });
      
      // Request grade 7 (G6), which is outside range
      const result = await accessControl.getAccessibleVideos(
        mockParentId,
        mockChildId,
        { grade: '7', page: 1, limit: 20 }
      );
      
      expect(result.videos).toEqual([]);
      expect(result.total).toBe(0);
    });
    
    it('should handle query errors gracefully', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      
      mockFindFirst.mockResolvedValue({ id: mockChildId });
      mockFindUnique.mockResolvedValue({
        planCode: PlanCode.MONTHLY_STANDARD,
        status: SubscriptionStatus.ACTIVE_STANDARD,
        currentPeriodEnd: futureDate,
      });
      
      // Simulate table not existing
      mockQueryRawUnsafe.mockRejectedValue(new Error('Table not found'));
      
      const result = await accessControl.getAccessibleVideos(
        mockParentId,
        mockChildId,
        { page: 1, limit: 20 }
      );
      
      expect(result.videos).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});

describe('Utility Functions', () => {
  describe('gradeLevelToName', () => {
    it('should convert level 0 to K4', () => {
      expect(gradeLevelToName(0)).toBe('K4');
    });
    
    it('should convert level 1 to K5', () => {
      expect(gradeLevelToName(1)).toBe('K5');
    });
    
    it('should convert level 2 to G1', () => {
      expect(gradeLevelToName(2)).toBe('G1');
    });
    
    it('should convert level 13 to G12', () => {
      expect(gradeLevelToName(13)).toBe('G12');
    });
  });
  
  describe('gradeNameToLevel', () => {
    it('should convert K4 to level 0', () => {
      expect(gradeNameToLevel('K4')).toBe(0);
      expect(gradeNameToLevel('k4')).toBe(0);
    });
    
    it('should convert K5 to level 1', () => {
      expect(gradeNameToLevel('K5')).toBe(1);
    });
    
    it('should convert G1 to level 2', () => {
      expect(gradeNameToLevel('G1')).toBe(2);
    });
    
    it('should convert G12 to level 13', () => {
      expect(gradeNameToLevel('G12')).toBe(13);
    });
    
    it('should return null for invalid names', () => {
      expect(gradeNameToLevel('invalid')).toBeNull();
      expect(gradeNameToLevel('G13')).toBeNull();
    });
  });
  
  describe('getPackageMapping', () => {
    it('should return mapping for valid plan code', () => {
      const mapping = getPackageMapping(PlanCode.MONTHLY_STANDARD);
      expect(mapping).toBeDefined();
      expect(mapping?.name).toBe('Tiểu Học PRO');
      expect(mapping?.minGrade).toBe(0);
      expect(mapping?.maxGrade).toBe(5);
    });
    
    it('should return undefined for invalid plan code', () => {
      const mapping = getPackageMapping('INVALID' as PlanCode);
      expect(mapping).toBeUndefined();
    });
  });
  
  describe('getAccessibleGradeLevels', () => {
    it('should return correct levels for TRIAL', () => {
      const levels = getAccessibleGradeLevels(PlanCode.TRIAL);
      expect(levels).toEqual([0, 1, 2]);
    });
    
    it('should return correct levels for YEARLY_FAMILY_PLUS', () => {
      const levels = getAccessibleGradeLevels(PlanCode.YEARLY_FAMILY_PLUS);
      expect(levels).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });
  });
  
  describe('isGradeAccessible', () => {
    it('should return true for accessible grade', () => {
      expect(isGradeAccessible(2, PlanCode.MONTHLY_STANDARD)).toBe(true);
    });
    
    it('should return false for inaccessible grade', () => {
      expect(isGradeAccessible(7, PlanCode.MONTHLY_STANDARD)).toBe(false);
    });
  });
});

describe('PACKAGE_GRADE_MAPPINGS', () => {
  it('should have correct mappings for all plans', () => {
    const trial = PACKAGE_GRADE_MAPPINGS.find(m => m.planCode === PlanCode.TRIAL);
    expect(trial?.maxGrade).toBe(2); // G1
    
    const monthly = PACKAGE_GRADE_MAPPINGS.find(m => m.planCode === PlanCode.MONTHLY_STANDARD);
    expect(monthly?.maxGrade).toBe(5); // G5
    
    const yearly = PACKAGE_GRADE_MAPPINGS.find(m => m.planCode === PlanCode.YEARLY_STANDARD);
    expect(yearly?.maxGrade).toBe(5); // G5
    
    const family = PACKAGE_GRADE_MAPPINGS.find(m => m.planCode === PlanCode.YEARLY_FAMILY_PLUS);
    expect(family?.maxGrade).toBe(13); // G12
  });
});
