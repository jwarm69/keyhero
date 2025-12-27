// Validation tests for audio timing system
// These tests verify PERFECT timing accuracy

import { WebAudioEngine } from './audioEngine.js';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

export class AudioEngineTests {
  private results: TestResult[] = [];

  /**
   * Test 1: Basic timing accuracy
   * Verify that 1 second of elapsed time = ~1.000s (±0.001s tolerance)
   */
  public async testBasicTiming(): Promise<TestResult> {
    const startTime = performance.now();
    const engine = new WebAudioEngine();

    try {
      await engine.start();

      // Wait exactly 1 second (measured by performance.now())
      await this.waitFor(1000);
      const songTime = engine.getSongTime();

      // Expected: 1.000s ± 0.001s
      const accuracy = Math.abs(songTime - 1.0);
      const passed = accuracy <= 0.001;

      engine.stop();
      const duration = performance.now() - startTime;

      const result: TestResult = {
        name: 'Test 1: Basic Timing Accuracy',
        passed,
        details: passed
          ? `✓ Perfect timing: ${songTime.toFixed(6)}s (accuracy: ±${accuracy.toFixed(6)}s)`
          : `✗ Timing error: ${songTime.toFixed(6)}s (error: ${accuracy.toFixed(6)}s, max: 0.001s)`,
        duration
      };

      this.results.push(result);
      return result;

    } catch (error) {
      engine.stop();
      const duration = performance.now() - startTime;

      const result: TestResult = {
        name: 'Test 1: Basic Timing Accuracy',
        passed: false,
        details: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
        duration
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 2: Restart reliability
   * Perform 50 consecutive restarts with no timing anomalies
   */
  public async testRestartReliability(): Promise<TestResult> {
    const startTime = performance.now();
    const engine = new WebAudioEngine();
    const restartCount = 50;
    const errors: string[] = [];

    try {
      for (let i = 0; i < restartCount; i++) {
        // Stop and restart
        engine.stop();
        await engine.start();

        // Check timing after 100ms
        await this.waitFor(100);
        const songTime = engine.getSongTime();

        // Should be approximately 0.1s
        const expectedTime = 0.1;
        const tolerance = 0.01; // ±10ms tolerance
        const accuracy = Math.abs(songTime - expectedTime);

        if (accuracy > tolerance) {
          errors.push(`Restart ${i + 1}: ${songTime.toFixed(6)}s (expected ~${expectedTime}s, error: ${accuracy.toFixed(6)}s)`);
        }

        // Stop for next iteration
        engine.stop();

        // Small delay between restarts
        await this.waitFor(10);
      }

      const passed = errors.length === 0;
      const duration = performance.now() - startTime;

      const result: TestResult = {
        name: 'Test 2: Restart Reliability (50 restarts)',
        passed,
        details: passed
          ? `✓ All ${restartCount} restarts successful with no timing anomalies`
          : `✗ ${errors.length} failures:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`,
        duration
      };

      this.results.push(result);
      return result;

    } catch (error) {
      engine.stop();
      const duration = performance.now() - startTime;

      const result: TestResult = {
        name: 'Test 2: Restart Reliability (50 restarts)',
        passed: false,
        details: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
        duration
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 3: Long-term drift detection
   * Play for 60 seconds and verify <1ms drift
   */
  public async testLongTermDrift(): Promise<TestResult> {
    const startTime = performance.now();
    const engine = new WebAudioEngine();

    try {
      await engine.start();

      // Sample timing every 10 seconds
      const samples: { realTime: number; songTime: number }[] = [];
      const sampleInterval = 10000; // 10 seconds
      const totalDuration = 60000; // 60 seconds

      for (let elapsed = 0; elapsed <= totalDuration; elapsed += sampleInterval) {
        await this.waitFor(sampleInterval);
        const realTime = performance.now() - startTime;
        const songTime = engine.getSongTime();
        samples.push({ realTime, songTime });
      }

      // Calculate drift at each sample point
      let maxDrift = 0;
      const drifts: number[] = [];

      for (const sample of samples) {
        const expectedSongTime = sample.realTime / 1000;
        const drift = Math.abs(sample.songTime - expectedSongTime);
        drifts.push(drift);
        maxDrift = Math.max(maxDrift, drift);
      }

      // Check if final drift is <1ms
      const finalDrift = drifts[drifts.length - 1];
      const passed = finalDrift < 0.001; // <1ms

      engine.stop();
      const duration = performance.now() - startTime;

      const result: TestResult = {
        name: 'Test 3: Long-term Drift (60 seconds)',
        passed,
        details: passed
          ? `✓ Minimal drift: ${(finalDrift * 1000).toFixed(3)}ms (max: ${(maxDrift * 1000).toFixed(3)}ms)`
          : `✗ Excessive drift: ${(finalDrift * 1000).toFixed(3)}ms (max allowed: 1ms)`,
        duration
      };

      this.results.push(result);
      return result;

    } catch (error) {
      engine.stop();
      const duration = performance.now() - startTime;

      const result: TestResult = {
        name: 'Test 3: Long-term Drift (60 seconds)',
        passed: false,
        details: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
        duration
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test 4: Pause/Resume timing accuracy
   * Verify that pause/resume doesn't affect timing
   */
  public async testPauseResumeTiming(): Promise<TestResult> {
    const startTime = performance.now();
    const engine = new WebAudioEngine();

    try {
      await engine.start();

      // Play for 1 second
      await this.waitFor(1000);
      let songTime = engine.getSongTime();
      const timeBeforePause = songTime;

      // Pause for 500ms
      engine.pause();
      await this.waitFor(500);

      // Should still report ~1.000s while paused
      songTime = engine.getSongTime();
      const timeWhilePaused = songTime;
      const pausedTimeAccuracy = Math.abs(timeWhilePaused - timeBeforePause);

      // Resume
      await engine.resume();

      // Play for another 1 second
      await this.waitFor(1000);
      songTime = engine.getSongTime();
      const timeAfterResume = songTime;

      // Should be ~2.000s (1s before + 1s after, pause time excluded)
      const expectedTime = 2.0;
      const finalAccuracy = Math.abs(timeAfterResume - expectedTime);

      const passed = pausedTimeAccuracy < 0.001 && finalAccuracy < 0.01;

      engine.stop();
      const duration = performance.now() - startTime;

      const result: TestResult = {
        name: 'Test 4: Pause/Resume Timing',
        passed,
        details: passed
          ? `✓ Pause time excluded: ${timeWhilePaused.toFixed(6)}s → ${timeAfterResume.toFixed(6)}s`
          : `✗ Timing error during pause/resume (paused: ${pausedTimeAccuracy.toFixed(6)}s, final: ${finalAccuracy.toFixed(6)}s)`,
        duration
      };

      this.results.push(result);
      return result;

    } catch (error) {
      engine.stop();
      const duration = performance.now() - startTime;

      const result: TestResult = {
        name: 'Test 4: Pause/Resume Timing',
        passed: false,
        details: `✗ Error: ${error instanceof Error ? error.message : String(error)}`,
        duration
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Run all tests and return summary
   */
  public async runAllTests(): Promise<{
    results: TestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      totalDuration: number;
    };
  }> {
    console.log('Running audio timing tests...\n');

    await this.testBasicTiming();
    await this.testRestartReliability();
    await this.testPauseResumeTiming();

    // Skip long-term test in normal runs (takes 60 seconds)
    // await this.testLongTermDrift();

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      results: this.results,
      summary: {
        total: this.results.length,
        passed,
        failed,
        totalDuration
      }
    };
  }

  /**
   * Helper: Wait for specified milliseconds
   */
  private waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Print test results to console
   */
  public printResults(): void {
    console.log('\n=== Audio Engine Test Results ===\n');

    for (const result of this.results) {
      console.log(`${result.passed ? '✓' : '✗'} ${result.name}`);
      console.log(`  ${result.details}`);
      console.log(`  Duration: ${result.duration.toFixed(0)}ms\n`);
    }

    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log(`---`);
    console.log(`Results: ${passed}/${total} tests passed (${((passed / total) * 100).toFixed(0)}%)`);
    console.log(`\n`);
  }
}

// Export convenience function for running tests
export async function runAudioEngineTests(): Promise<void> {
  const tests = new AudioEngineTests();
  await tests.runAllTests();
  tests.printResults();
}
