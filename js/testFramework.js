class TestFramework {
    constructor() {
        this.tests = new Map();
        this.results = [];
        this.isRunning = false;
        this.currentSuite = null;
    }

    // Define a test suite
    describe(suiteName, testFn) {
        this.currentSuite = suiteName;
        if (!this.tests.has(suiteName)) {
            this.tests.set(suiteName, []);
        }
        testFn();
        this.currentSuite = null;
    }

    // Define a test case
    it(testName, testFn) {
        if (!this.currentSuite) {
            throw new Error('Test must be inside a describe block');
        }
        
        this.tests.get(this.currentSuite).push({
            name: testName,
            fn: testFn,
            timeout: 5000
        });
    }

    // Assertions
    expect(actual) {
        return {
            toBe: (expected) => {
                if (actual !== expected) {
                    throw new Error(`Expected ${actual} to be ${expected}`);
                }
            },
            toEqual: (expected) => {
                if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                    throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
                }
            },
            toBeTruthy: () => {
                if (!actual) {
                    throw new Error(`Expected ${actual} to be truthy`);
                }
            },
            toBeFalsy: () => {
                if (actual) {
                    throw new Error(`Expected ${actual} to be falsy`);
                }
            },
            toThrow: () => {
                if (typeof actual !== 'function') {
                    throw new Error('Expected a function');
                }
                try {
                    actual();
                    throw new Error('Expected function to throw');
                } catch (error) {
                    // Expected to throw
                }
            },
            toBeGreaterThan: (expected) => {
                if (actual <= expected) {
                    throw new Error(`Expected ${actual} to be greater than ${expected}`);
                }
            },
            toBeLessThan: (expected) => {
                if (actual >= expected) {
                    throw new Error(`Expected ${actual} to be less than ${expected}`);
                }
            }
        };
    }

    // Run all tests
    async runTests() {
        if (this.isRunning) {
            console.warn('Tests are already running');
            return;
        }

        this.isRunning = true;
        this.results = [];
        
        console.log('🧪 Starting test run...');
        const startTime = performance.now();

        for (const [suiteName, tests] of this.tests) {
            console.log(`\n📋 Running suite: ${suiteName}`);
            
            for (const test of tests) {
                await this.runSingleTest(suiteName, test);
            }
        }

        const endTime = performance.now();
        const duration = endTime - startTime;

        this.printResults(duration);
        this.isRunning = false;

        return this.results;
    }

    // Run a single test
    async runSingleTest(suiteName, test) {
        const startTime = performance.now();
        let result = {
            suite: suiteName,
            name: test.name,
            passed: false,
            error: null,
            duration: 0
        };

        try {
            // Run test with timeout
            await Promise.race([
                Promise.resolve(test.fn()),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Test timeout')), test.timeout)
                )
            ]);
            
            result.passed = true;
            console.log(`  ✅ ${test.name}`);
        } catch (error) {
            result.error = this.sanitizeErrorMessage(error.message);
            console.log(`  ❌ ${test.name}: ${result.error}`);
        }

        result.duration = performance.now() - startTime;
        this.results.push(result);
    }

    // Print test results
    printResults(totalDuration) {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.length - passed;
        
        console.log(`\n📊 Test Results:`);
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏱️ Duration: ${totalDuration.toFixed(2)}ms`);
        
        if (failed > 0) {
            console.log(`\n💥 Failed Tests:`);
            this.results.filter(r => !r.passed).forEach(result => {
                console.log(`  ${result.suite} > ${result.name}: ${this.sanitizeErrorMessage(result.error)}`);
            });
        }
    }

    // Mock functions for testing
    createMock(obj = {}) {
        const mock = { ...obj };
        mock._calls = [];
        
        Object.keys(mock).forEach(key => {
            if (typeof mock[key] === 'function') {
                const originalFn = mock[key];
                mock[key] = (...args) => {
                    mock._calls.push({ method: key, args });
                    return originalFn(...args);
                };
            }
        });
        
        return mock;
    }

    // Spy on functions
    spyOn(obj, method) {
        const original = obj[method];
        const calls = [];
        
        obj[method] = (...args) => {
            calls.push(args);
            return original.apply(obj, args);
        };
        
        obj[method].calls = calls;
        obj[method].restore = () => {
            obj[method] = original;
        };
        
        return obj[method];
    }
    
    sanitizeErrorMessage(message) {
        if (typeof message !== 'string') return 'Unknown error';
        return message.replace(/[<>"'&]/g, (match) => {
            const entities = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' };
            return entities[match];
        });
    }
}

// Game-specific test utilities
class GameTestUtils {
    static createMockGameData() {
        return {
            playerName: 'TestPlayer',
            money: 1000,
            stats: { health: 100, damage: 10, armor: 0 },
            inventory: { sword: 1, shield: 1 },
            addMoney: (amount) => { this.money += amount; },
            spendMoney: (amount) => { 
                if (this.money >= amount) {
                    this.money -= amount;
                    return true;
                }
                return false;
            },
            save: () => {}
        };
    }

    static createMockScene() {
        return {
            add: {
                text: () => ({ setOrigin: () => ({}), setVisible: () => ({}) }),
                graphics: () => ({ fillStyle: () => ({}), fillRect: () => ({}) })
            },
            time: {
                delayedCall: () => {},
                addEvent: () => ({ destroy: () => {} })
            },
            physics: {
                pause: () => {},
                resume: () => {}
            }
        };
    }

    static async waitFor(condition, timeout = 1000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (condition()) return true;
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        throw new Error('Condition not met within timeout');
    }
}

// Create global instances
window.testFramework = new TestFramework();
window.GameTestUtils = GameTestUtils;

// Export for use in tests
window.describe = (name, fn) => window.testFramework.describe(name, fn);
window.it = (name, fn) => window.testFramework.it(name, fn);
window.expect = (actual) => window.testFramework.expect(actual);