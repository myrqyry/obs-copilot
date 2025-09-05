import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { jest } from '@jest/globals';
import HealthStatusIndicator from '../HealthStatusIndicator';
import useHealthStatus from '@/hooks/useHealthStatus';

// Mock the health status hook
jest.mock('@/hooks/useHealthStatus');

describe('HealthStatusIndicator', () => {
  const mockUseHealthStatus = useHealthStatus as jest.MockedFunction<typeof useHealthStatus>; // Keep this line as is

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays healthy status correctly', () => {
    mockUseHealthStatus.mockReturnValue({
      gemini: 'healthy',
      obs: 'healthy',
      mcp: 'healthy',
      overall: 'healthy',
      lastChecked: Date.now(),
      isChecking: false,
      refreshHealth: jest.fn(),
    });

    render(<HealthStatusIndicator />);

    expect(screen.getByText('All Systems Operational')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gemini connection healthy/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /obs studio connected/i })).toBeInTheDocument();
  });

  it('displays degraded status with warnings', () => {
    mockUseHealthStatus.mockReturnValue({
      gemini: 'healthy',
      obs: 'degraded',
      mcp: 'healthy',
      overall: 'degraded',
      lastChecked: Date.now(),
      isChecking: false,
      refreshHealth: jest.fn(),
    });

    render(<HealthStatusIndicator />);

    expect(screen.getByText('Some Systems Degraded')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /obs studio degraded/i })).toBeInTheDocument();
  });

  it('displays critical status with errors', () => {
    mockUseHealthStatus.mockReturnValue({
      gemini: 'critical',
      obs: 'healthy',
      mcp: 'healthy',
      overall: 'critical',
      lastChecked: Date.now(),
      isChecking: false,
      refreshHealth: jest.fn(),
    });

    render(<HealthStatusIndicator />);

    expect(screen.getByText('Critical Systems Down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /gemini connection failing/i })).toBeInTheDocument();
  });

  it('shows loading state when checking health', () => {
    mockUseHealthStatus.mockReturnValue({
      gemini: 'healthy',
      obs: 'healthy',
      mcp: 'healthy',
      overall: 'healthy',
      lastChecked: Date.now(),
      isChecking: true,
      refreshHealth: jest.fn(),
    });

    render(<HealthStatusIndicator />);

    expect(screen.getByRole('button', { name: /refreshing health status/i })).toBeInTheDocument();
  });

  it('refreshes health status when refresh button is clicked', async () => {
    const mockRefreshHealth = jest.fn();
    mockUseHealthStatus.mockReturnValue({
      gemini: 'healthy',
      obs: 'healthy',
      mcp: 'healthy',
      overall: 'healthy',
      lastChecked: Date.now(),
      isChecking: false,
      refreshHealth: mockRefreshHealth,
    });

    render(<HealthStatusIndicator />);

    const refreshButton = screen.getByRole('button', { name: /refresh health status/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(mockRefreshHealth).toHaveBeenCalledTimes(1);
    });
  });

  it('displays last checked time correctly', () => {
    const lastChecked = Date.now() - 300000; // 5 minutes ago
    mockUseHealthStatus.mockReturnValue({
      gemini: 'healthy',
      obs: 'healthy',
      mcp: 'healthy',
      overall: 'healthy',
      lastChecked,
      isChecking: false,
      refreshHealth: jest.fn(),
    });

    render(<HealthStatusIndicator />);

    expect(screen.getByText('Last checked 5 minutes ago')).toBeInTheDocument();
  });

  it('shows tooltip with detailed service information', async () => {
    mockUseHealthStatus.mockReturnValue({
      gemini: 'healthy',
      obs: 'healthy',
      mcp: 'degraded',
      overall: 'degraded',
      lastChecked: Date.now(),
      isChecking: false,
      refreshHealth: jest.fn(),
    });

    render(<HealthStatusIndicator />);

    const indicator = screen.getByRole('button', { name: /refresh health status/i });
    fireEvent.mouseOver(indicator);

    await waitFor(() => {
      expect(screen.getByText('MCP Servers: Degraded')).toBeInTheDocument();
      expect(screen.getByText('Some services are experiencing issues')).toBeInTheDocument();
    });
  });

  it('provides accessible screen reader text', () => {
    mockUseHealthStatus.mockReturnValue({
      gemini: 'healthy',
      obs: 'healthy',
      mcp: 'healthy',
      overall: 'healthy',
      lastChecked: Date.now(),
      isChecking: false,
      refreshHealth: jest.fn(),
    });

    render(<HealthStatusIndicator />);

    const srStatus = screen.getByText('System status: All systems operational');
    expect(srStatus).toHaveClass('sr-only');
  });
});
