class ErrorLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.logLevels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        this.currentLevel = this.logLevels.INFO;
        this.listeners = new Set();
        
        this.setupGlobalErrorHandling();
        this.startPerformanceMonitoring();
    }

    setupGlobalErrorHandling() {
        // Catch unhandled errors
        window.addEventListener('error', (event) => {
            this.error('Unhandled Error:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.error('Unhandled Promise Rejection:', event.reason);
        });

        // Override console methods to capture logs
        this.originalConsole = {
            error: console.error,
            warn: console.warn,
            info: console.info,
            log: console.log
        };

        console.error = (...args) => {
            this.error(...args);
            this.originalConsole.error(...args);
        };

        console.warn = (...args) => {
            this.warn(...args);
            this.originalConsole.warn(...args);
        };
    }

    log(level, ...args) {
        if (level > this.currentLevel) return;

        const entry = {
            timestamp: Date.now(),
            level: Object.keys(this.logLevels)[level],
            message: args.map(arg => 
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(' '),
            stack: new Error().stack,
            url: window.location.href,
            userAgent: navigator.userAgent
        };

        this.logs.push(entry);
        
        // Trim logs if too many
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs * 0.8);
        }

        // Notify listeners
        this.listeners.forEach(listener => {
            try {
                listener(entry);
            } catch (error) {
                this.originalConsole.error('Error in log listener:', error);
            }
        });

        // Send critical errors to external service (if configured)
        if (level === this.logLevels.ERROR) {
            this.sendToExternalService(entry);
        }
    }

    error(...args) { this.log(this.logLevels.ERROR, ...args); }
    warn(...args) { this.log(this.logLevels.WARN, ...args); }
    info(...args) { this.log(this.logLevels.INFO, ...args); }
    debug(...args) { this.log(this.logLevels.DEBUG, ...args); }

    // Performance monitoring
    startPerformanceMonitoring() {
        this.performanceMetrics = {
            saveFrequency: [],
            loadTimes: [],
            memoryUsage: [],
            frameRates: []
        };

        // Monitor save frequency
        if (window.stateManager) {
            window.stateManager.subscribe('save_action', () => {
                this.performanceMetrics.saveFrequency.push(Date.now());
                if (this.performanceMetrics.saveFrequency.length > 100) {
                    this.performanceMetrics.saveFrequency = this.performanceMetrics.saveFrequency.slice(-50);
                }
            });
        }

        // Monitor memory usage every 30 seconds
        setInterval(() => {
            if (performance.memory) {
                this.performanceMetrics.memoryUsage.push({
                    timestamp: Date.now(),
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                });
                
                if (this.performanceMetrics.memoryUsage.length > 100) {
                    this.performanceMetrics.memoryUsage = this.performanceMetrics.memoryUsage.slice(-50);
                }
            }
        }, 30000);
    }

    // Track specific game events
    trackGameEvent(event, data = {}) {
        this.info(`Game Event: ${event}`, data);
    }

    trackPerformance(metric, value) {
        if (!this.performanceMetrics[metric]) {
            this.performanceMetrics[metric] = [];
        }
        
        this.performanceMetrics[metric].push({
            timestamp: Date.now(),
            value
        });
        
        if (this.performanceMetrics[metric].length > 100) {
            this.performanceMetrics[metric] = this.performanceMetrics[metric].slice(-50);
        }
    }

    // Get performance summary
    getPerformanceSummary() {
        const summary = {};
        
        Object.keys(this.performanceMetrics).forEach(metric => {
            const data = this.performanceMetrics[metric];
            if (data.length > 0) {
                const values = data.map(d => d.value || d.used || 1);
                summary[metric] = {
                    count: data.length,
                    average: values.reduce((a, b) => a + b, 0) / values.length,
                    min: Math.min(...values),
                    max: Math.max(...values),
                    latest: values[values.length - 1]
                };
            }
        });
        
        return summary;
    }

    // Export logs for debugging
    exportLogs() {
        const exportData = {
            logs: this.logs,
            performance: this.performanceMetrics,
            summary: this.getPerformanceSummary(),
            timestamp: new Date().toISOString(),
            gameState: window.stateManager?.exportState()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mini-tycoon-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Send to external logging service (placeholder)
    sendToExternalService(entry) {
        // This would integrate with services like Sentry, LogRocket, etc.
        // For now, just store in localStorage for debugging
        try {
            const criticalLogs = JSON.parse(localStorage.getItem('miniTycoon_criticalLogs') || '[]');
            criticalLogs.push(entry);
            
            // Keep only last 50 critical logs
            if (criticalLogs.length > 50) {
                criticalLogs.splice(0, criticalLogs.length - 50);
            }
            
            localStorage.setItem('miniTycoon_criticalLogs', JSON.stringify(criticalLogs));
        } catch (error) {
            this.originalConsole.error('Failed to store critical log:', error);
        }
    }

    // Subscribe to log events
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    // Clear logs
    clear() {
        this.logs = [];
        this.performanceMetrics = {
            saveFrequency: [],
            loadTimes: [],
            memoryUsage: [],
            frameRates: []
        };
    }

    // Get recent logs
    getRecentLogs(count = 50) {
        return this.logs.slice(-count);
    }

    // Filter logs by level
    getLogsByLevel(level) {
        const levelName = Object.keys(this.logLevels)[level];
        return this.logs.filter(log => log.level === levelName);
    }
}

// Create global instance
window.errorLogger = new ErrorLogger();