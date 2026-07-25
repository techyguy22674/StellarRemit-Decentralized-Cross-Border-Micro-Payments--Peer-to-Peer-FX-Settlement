/**
 * Dashboard Page Unit Tests — StellarRemit Protocol
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockWalletStore = {
  isConnected: false,
  address: null as string | null,
  balance: null as string | null,
  network: null as string | null,
  isConnecting: false,
  error: null as string | null,
};

vi.mock('@/store/wallet-store', () => ({
  useWalletStore: () => mockWalletStore,
}));

vi.mock('@/store/transaction-store', () => ({
  useTransactionStore: () => ({
    getRecentTransactions: () => [],
  }),
}));

vi.mock('@/hooks/useWallet', () => ({
  useWallet: () => ({
    ...mockWalletStore,
    connect: vi.fn(),
    disconnect: vi.fn(),
    refreshBalance: vi.fn(),
    restoreWallet: vi.fn(),
    rewardBalance: null,
  }),
}));

vi.mock('@/lib/stellar/config', () => ({
  STELLAR_CONFIG: {
    network: 'testnet',
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
    horizonUrl: 'https://horizon-testnet.stellar.org',
    contractId: 'CDIUMYZYWNPFOAAYO3L5ULQMQCYBLKVOUXFKHARVCUYZLKUIRQERRLVM',
    rewardTokenId: 'CDXJJX2COYKB5MQX5OL235JYRCHGT6FJOIOCPB3T4KDKTXYGRBURH4L6',
  },
  REMIT_CONTRACT_ID: 'CDIUMYZYWNPFOAAYO3L5ULQMQCYBLKVOUXFKHARVCUYZLKUIRQERRLVM',
  SRT_TOKEN_CONTRACT_ID: 'CDXJJX2COYKB5MQX5OL235JYRCHGT6FJOIOCPB3T4KDKTXYGRBURH4L6',
  POOL_CONTRACT_ID: 'CDIUMYZYWNPFOAAYO3L5ULQMQCYBLKVOUXFKHARVCUYZLKUIRQERRLVM',
  SPL_TOKEN_CONTRACT_ID: 'CDXJJX2COYKB5MQX5OL235JYRCHGT6FJOIOCPB3T4KDKTXYGRBURH4L6',
  NATIVE_TOKEN_ADDRESS: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
  DEPLOYER_ADDRESS: 'GCMVNWEORWXFEXITRRMFVAZBW65GRZKJA5PQM4OG3X3YSJMZ2PG3MEQD',
  CORRIDORS: [],
  REMIT_FEE_BPS: 50,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/dashboard',
}));

import DashboardPage from '../page';

describe('Dashboard Page', () => {
  beforeEach(() => {
    mockWalletStore.isConnected = false;
    mockWalletStore.address = null;
    mockWalletStore.balance = null;
    mockWalletStore.error = null;
    mockWalletStore.isConnecting = false;
  });

  it('renders the page heading "Wallet Dashboard"', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Wallet Dashboard')).toBeInTheDocument();
  });

  it('renders connection banner', () => {
    render(<DashboardPage />);
    expect(screen.getByText('No Wallet Connected')).toBeInTheDocument();
  });

  it('shows XLM and SRT token balance cards', () => {
    render(<DashboardPage />);
    expect(screen.getByText('XLM Balance')).toBeInTheDocument();
    expect(screen.getByText('SRT Tokens')).toBeInTheDocument();
  });

  it('shows contract reference section', () => {
    render(<DashboardPage />);
    expect(screen.getByText('StellarRemit Contract Addresses')).toBeInTheDocument();
  });

  it('renders transaction history section', () => {
    render(<DashboardPage />);
    expect(screen.getByText('Transaction History')).toBeInTheDocument();
  });
});
