import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { API_URL } from '../config/api.config';

/**
 * Keepalive Service
 * 
 * Sends periodic heartbeat requests to the server to prevent container spin-down
 * during long exam sessions (e.g., 60-minute exams on Render).
 * 
 * Usage:
 * - Call start() when exam begins
 * - Call stop() when exam ends or user leaves
 */
@Injectable({
  providedIn: 'root',
})
export class KeepaliveService {
  private http = inject(HttpClient);
  private readonly apiUrl = inject(API_URL);

  // Heartbeat interval: 5 minutes (well under Render's 15-minute spin-down timeout)
  private readonly HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

  private heartbeatInterval?: ReturnType<typeof setInterval>;
  
  // Signal to track if heartbeat is active (for debugging/monitoring)
  private readonly isActive = signal(false);

  /**
   * Start sending periodic heartbeat requests
   * Only one heartbeat can be active at a time
   */
  start(): void {
    // Prevent multiple heartbeats from running
    if (this.heartbeatInterval) {
      return;
    }

    this.isActive.set(true);

    // Send initial heartbeat immediately
    this.sendHeartbeat();

    // Schedule periodic heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Stop sending heartbeat requests
   */
  stop(): void {
    if (!this.heartbeatInterval) {
      return;
    }

    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = undefined;
    this.isActive.set(false);
  }

  /**
   * Check if heartbeat is currently active
   */
  getActiveStatus() {
    return this.isActive.asReadonly();
  }

  /**
   * Send a single heartbeat request
   */
  private sendHeartbeat(): void {
    this.http.get<{ status: string; timestamp: number }>(`${this.apiUrl}/health/keepalive`)
      .subscribe({
        error: (err) => {
          console.error('[Keepalive] Heartbeat failed:', err);
          // Don't stop the heartbeat on error - keep trying
          // Server might be temporarily unavailable but will recover
        },
      });
  }
}
