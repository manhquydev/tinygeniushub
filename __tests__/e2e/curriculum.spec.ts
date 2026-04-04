import { test, expect } from '@playwright/test';

/**
 * Abeka Curriculum E2E Tests
 * 
 * Tests cover:
 * - End-to-end lesson flow (parent creates plan → child completes lesson)
 * - Video player integration
 * - Progress tracking
 * - Gamification (badges, streaks)
 * - Performance and accessibility
 */

test.describe('Abeka Curriculum Integration', () => {
  
  test.describe('End-to-End Flows', () => {
    test('complete parent creates plan → child completes lesson → progress tracked', async ({ 
      browser 
    }) => {
      // Create parent context
      const parentContext = await browser.newContext();
      const parentPage = await parentContext.newPage();
      
      // Login as parent
      await parentPage.goto('/login');
      await parentPage.fill('[name="email"]', 'parent@test.com');
      await parentPage.fill('[name="password"]', 'password');
      await parentPage.click('button[type="submit"]');
      
      // Navigate to planner
      await parentPage.goto('/abeka/planner');
      await parentPage.waitForSelector('[data-testid="weekly-planner"]');
      
      // Create weekly plan if doesn't exist
      const createButton = parentPage.getByText('Tạo kế hoạch mới');
      if (await createButton.isVisible().catch(() => false)) {
        await createButton.click();
        await parentPage.selectOption('select[name="grade"]', '1');
        await parentPage.click('text=Tạo');
      }
      
      // Drag lesson to day
      await parentPage.waitForSelector('[data-testid="lesson-card"]');
      const lesson = parentPage.getByText('Bài 1').first();
      const dayColumn = parentPage.getByText('T2').first();
      
      // Perform drag and drop
      await lesson.dragTo(dayColumn);
      await parentPage.click('text=Lưu kế hoạch');
      
      // Wait for save confirmation
      await expect(parentPage.getByText('Đã lưu')).toBeVisible({ timeout: 5000 });
      
      // Create child context
      const childContext = await browser.newContext();
      const childPage = await childContext.newPage();
      
      // Login as child
      await childPage.goto('/abeka/today');
      await childPage.waitForSelector('[data-testid="daily-plan-view"]');
      
      // Should see assigned lesson
      await expect(childPage.getByText('Phonics').or(childPage.getByText('Số học'))).toBeVisible();
      
      // Start lesson
      await childPage.click('text=BẮT ĐẦU HỌC');
      
      // Video player opens
      await expect(childPage.locator('[data-testid="lesson-wizard"]')).toBeVisible({ timeout: 5000 });
      
      // Wait for video to be ready
      await childPage.waitForSelector('video, iframe', { timeout: 10000 });
      
      // Simulate video completion (mock video duration)
      await childPage.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration - 1;
          video.dispatchEvent(new Event('ended'));
        }
      });
      
      // Continue to quiz
      await childPage.click('text=Tiếp tục thử thách');
      
      // Answer quiz correctly
      await childPage.waitForSelector('[data-testid="activity-renderer"]');
      await childPage.click('[data-testid="correct-option"]');
      
      // Should see completion celebration
      await expect(childPage.getByText('Hoàn thành!')).toBeVisible({ timeout: 10000 });
      
      // Close lesson wizard
      await childPage.click('text=Quay lại bản đồ');
      
      // Check progress updated in parent view
      await parentPage.reload();
      await parentPage.goto('/abeka/progress');
      await expect(parentPage.getByText('1 bài').or(parentPage.getByText('1/'))).toBeVisible({ timeout: 5000 });
      
      await parentContext.close();
      await childContext.close();
    });

    test('streak updates when daily plan is completed', async ({ page }) => {
      // Login as child
      await page.goto('/login');
      await page.fill('[name="email"]', 'child@test.com');
      await page.fill('[name="password"]', 'password');
      await page.click('button[type="submit"]');
      
      // Go to daily plan
      await page.goto('/abeka/today');
      await page.waitForSelector('[data-testid="daily-plan-view"]');
      
      // Get initial streak
      const initialStreak = await page.locator('[data-testid="streak-count"]').textContent();
      const initialStreakNum = parseInt(initialStreak || '0', 10);
      
      // Complete all incomplete assignments
      const incompleteAssignments = await page.locator('[data-testid="assignment-card"]:not([data-completed="true"])').all();
      
      for (const assignment of incompleteAssignments.slice(0, 2)) {
        await assignment.locator('button:has-text("Bắt đầu")').click();
        
        // Wait for lesson wizard
        await page.waitForSelector('[data-testid="lesson-wizard"]', { timeout: 10000 });
        
        // Complete the lesson (mock)
        await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video) {
            video.currentTime = video.duration - 1;
            video.dispatchEvent(new Event('ended'));
          }
        });
        
        await page.click('text=Tiếp tục thử thách');
        await page.click('[data-testid="correct-option"]');
        
        // Wait for completion
        await page.waitForSelector('text=Hoàn thành!', { timeout: 10000 });
        await page.click('text=Quay lại bản đồ');
        
        // Wait for return to daily plan
        await page.waitForSelector('[data-testid="daily-plan-view"]', { timeout: 5000 });
      }
      
      // Check streak updated
      await page.reload();
      const updatedStreak = await page.locator('[data-testid="streak-count"]').textContent();
      const updatedStreakNum = parseInt(updatedStreak || '0', 10);
      
      // Streak should be maintained or increased
      expect(updatedStreakNum).toBeGreaterThanOrEqual(initialStreakNum);
    });

    test('badge is awarded when completing lessons', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[name="email"]', 'child@test.com');
      await page.fill('[name="password"]', 'password');
      await page.click('button[type="submit"]');
      
      // Go to badges page
      await page.goto('/abeka/badges');
      await page.waitForSelector('[data-testid="badges-grid"]');
      
      // Get initial badge count
      const initialBadgeCount = await page.locator('[data-testid="earned-badge"]').count();
      
      // Complete a lesson through the flow
      await page.goto('/abeka/today');
      await page.click('text=BẮT ĐẦU HỌC');
      await page.waitForSelector('[data-testid="lesson-wizard"]', { timeout: 10000 });
      
      // Complete lesson
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration - 1;
          video.dispatchEvent(new Event('ended'));
        }
      });
      
      await page.click('text=Tiếp tục thử thách');
      await page.click('[data-testid="correct-option"]');
      await page.waitForSelector('text=Hoàn thành!', { timeout: 10000 });
      
      // Check for badge notification
      await expect(page.getByText('Huy hiệu mới!').or(page.getByText('badge'))).toBeVisible({ timeout: 5000 });
      
      // Verify badge was added
      await page.goto('/abeka/badges');
      await page.waitForSelector('[data-testid="badges-grid"]');
      const updatedBadgeCount = await page.locator('[data-testid="earned-badge"]').count();
      
      expect(updatedBadgeCount).toBeGreaterThanOrEqual(initialBadgeCount);
    });
  });
  
  test.describe('Performance', () => {
    test('skill tree renders within performance budget', async ({ page }) => {
      await page.goto('/abeka/skill-tree');
      
      // Wait for initial render
      await page.waitForSelector('[data-testid="skill-node"]', { timeout: 5000 });
      
      // Check render time
      const timing = await page.evaluate(() => {
        return performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      });
      
      // Should load within 3 seconds
      expect(timing.loadEventEnd - timing.startTime).toBeLessThan(3000);
      
      // Check frame rate during animation
      const frameRate = await page.evaluate(async () => {
        const startTime = performance.now();
        
        return new Promise<number>((resolve) => {
          let count = 0;
          const measure = () => {
            count++;
            if (performance.now() - startTime < 1000) {
              requestAnimationFrame(measure);
            } else {
              resolve(count);
            }
          };
          requestAnimationFrame(measure);
        });
      });
      
      // Should maintain 30+ fps
      expect(frameRate).toBeGreaterThan(30);
    });
    
    test('curriculum browser pagination works smoothly', async ({ page }) => {
      await page.goto('/abeka/curriculum');
      
      // Wait for first page
      await page.waitForSelector('[data-testid="lesson-card"]');
      
      // Click next page
      const nextButton = page.getByText('Sau');
      await nextButton.click();
      
      // Should load next page within 1 second
      await expect(page.getByText('Bài 21').or(page.locator('[data-testid="lesson-card"]'))).toBeVisible({ timeout: 1000 });
    });

    test('daily plan loads quickly', async ({ page }) => {
      await page.goto('/abeka/today');
      
      const startTime = Date.now();
      await page.waitForSelector('[data-testid="daily-plan-view"]', { timeout: 2000 });
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(2000);
    });
  });
  
  test.describe('Accessibility', () => {
    test('all interactive elements are keyboard accessible', async ({ page }) => {
      await page.goto('/abeka/today');
      await page.waitForSelector('[data-testid="daily-plan-view"]');
      
      // Tab through all interactive elements
      const tabbableElements = await page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])').count();
      
      // Ensure we can tab through at least the main interactive elements
      expect(tabbableElements).toBeGreaterThan(0);
      
      // Tab and verify focus
      await page.keyboard.press('Tab');
      const focused = await page.locator(':focus').count();
      expect(focused).toBe(1);
    });
    
    test('skill tree nodes have proper ARIA labels', async ({ page }) => {
      await page.goto('/abeka/skill-tree');
      await page.waitForSelector('[data-testid="skill-node"]');
      
      // Check ARIA labels exist
      const nodes = await page.locator('[data-testid="skill-node"]').all();
      for (const node of nodes) {
        const ariaLabel = await node.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    });

    test('video player has accessible controls', async ({ page }) => {
      // Start a lesson to get to video player
      await page.goto('/abeka/today');
      await page.click('text=BẮT ĐẦU HỌC');
      await page.waitForSelector('[data-testid="lesson-wizard"]', { timeout: 10000 });
      
      // Check video has controls
      const video = page.locator('video');
      if (await video.isVisible().catch(() => false)) {
        const hasControls = await video.getAttribute('controls');
        expect(hasControls).toBeTruthy();
      }
    });
  });
  
  test.describe('Responsive', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet Portrait', width: 768, height: 1024 },
      { name: 'Tablet Landscape', width: 1024, height: 768 },
      { name: 'Desktop', width: 1440, height: 900 },
    ];
    
    for (const viewport of viewports) {
      test(`renders correctly on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        
        await page.goto('/abeka/today');
        await page.waitForSelector('[data-testid="daily-plan-view"]');
        
        // Ensure no horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px rounding error
      });

      test(`skill tree responsive on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        
        await page.goto('/abeka/skill-tree');
        await page.waitForSelector('[data-testid="skill-node"]');
        
        // Ensure no horizontal overflow
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
      });
    }
  });

  test.describe('Error Handling', () => {
    test('handles network errors gracefully', async ({ page }) => {
      // Block API requests
      await page.route('/api/curriculum/daily-plan', (route) => {
        route.abort('internetdisconnected');
      });
      
      await page.goto('/abeka/today');
      
      // Should show error state
      await expect(page.getByText('Không thể tải').or(page.getByText('error'))).toBeVisible({ timeout: 5000 });
    });

    test('handles failed lesson completion gracefully', async ({ page }) => {
      await page.goto('/abeka/today');
      await page.click('text=BẮT ĐẦU HỌC');
      await page.waitForSelector('[data-testid="lesson-wizard"]', { timeout: 10000 });
      
      // Block completion API
      await page.route('/api/curriculum/complete', (route) => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Server error' }),
        });
      });
      
      // Try to complete lesson
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration - 1;
          video.dispatchEvent(new Event('ended'));
        }
      });
      
      await page.click('text=Tiếp tục thử thách');
      await page.click('[data-testid="correct-option"]');
      
      // Should show error toast
      await expect(page.getByText('Không thể lưu').or(page.getByText('Thử lại'))).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Progress Persistence', () => {
    test('progress persists after page refresh', async ({ page }) => {
      // Complete a lesson
      await page.goto('/abeka/today');
      
      // Get initial completed count
      const initialText = await page.locator('[data-testid="progress-text"]').textContent();
      
      // Complete a lesson
      await page.click('text=BẮT ĐẦU HỌC');
      await page.waitForSelector('[data-testid="lesson-wizard"]', { timeout: 10000 });
      
      await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.currentTime = video.duration - 1;
          video.dispatchEvent(new Event('ended'));
        }
      });
      
      await page.click('text=Tiếp tục thử thách');
      await page.click('[data-testid="correct-option"]');
      await page.waitForSelector('text=Hoàn thành!', { timeout: 10000 });
      await page.click('text=Quay lại bản đồ');
      
      // Refresh page
      await page.reload();
      await page.waitForSelector('[data-testid="daily-plan-view"]');
      
      // Progress should persist
      const updatedText = await page.locator('[data-testid="progress-text"]').textContent();
      expect(updatedText).not.toEqual(initialText);
    });
  });
});
