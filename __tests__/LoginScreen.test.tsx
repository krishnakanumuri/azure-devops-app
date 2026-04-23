import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import LoginScreen from '../src/screens/LoginScreen';
import { useAuthStore } from '../src/store';
import * as api from '../src/api';

// Mock the auth store
jest.mock('../src/store', () => ({
  useAuthStore: jest.fn(),
}));

// Mock the API layer so no real HTTP calls are made
jest.mock('../src/api', () => ({
  getProjects: jest.fn(),
}));

const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockExpireSession = jest.fn();

function setupAuthStore(overrides = {}) {
  (useAuthStore as unknown as jest.Mock).mockReturnValue({
    login: mockLogin,
    orgUrl: '',
    ...overrides,
  });
  (useAuthStore as any).getState = jest.fn().mockReturnValue({
    logout: mockLogout,
    expireSession: mockExpireSession,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupAuthStore();
});

describe('LoginScreen – rendering', () => {
  it('renders the Azure DevOps header', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Azure DevOps')).toBeTruthy();
    expect(screen.getByText('Pipeline Manager')).toBeTruthy();
  });

  it('renders the Organisation URL label and input', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Organisation URL')).toBeTruthy();
    expect(
      screen.getByPlaceholderText('https://dev.azure.com/yourorg'),
    ).toBeTruthy();
  });

  it('renders the Personal Access Token label and input', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Personal Access Token')).toBeTruthy();
    expect(screen.getByPlaceholderText('Paste your PAT here')).toBeTruthy();
  });

  it('renders the Sign In button', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Sign In')).toBeTruthy();
  });

  it('does not show an error message on initial render', () => {
    render(<LoginScreen />);
    // The error state texts are specific strings; none should appear before interaction
    expect(screen.queryByText('Both fields are required.')).toBeNull();
    expect(screen.queryByText(/login failed/i)).toBeNull();
  });
});

describe('LoginScreen – user input', () => {
  it('allows the user to type an organisation URL', () => {
    render(<LoginScreen />);
    const orgInput = screen.getByPlaceholderText('https://dev.azure.com/yourorg');
    fireEvent.changeText(orgInput, 'https://dev.azure.com/myorg');
    expect(orgInput.props.value).toBe('https://dev.azure.com/myorg');
  });

  it('allows the user to type a PAT', () => {
    render(<LoginScreen />);
    const patInput = screen.getByPlaceholderText('Paste your PAT here');
    fireEvent.changeText(patInput, 'my-secret-pat');
    expect(patInput.props.value).toBe('my-secret-pat');
  });

  it('masks the PAT input (secureTextEntry)', () => {
    render(<LoginScreen />);
    const patInput = screen.getByPlaceholderText('Paste your PAT here');
    expect(patInput.props.secureTextEntry).toBe(true);
  });
});

describe('LoginScreen – validation', () => {
  it('shows an error when Sign In is pressed with empty fields', async () => {
    render(<LoginScreen />);
    fireEvent.press(screen.getByText('Sign In'));
    await waitFor(() =>
      expect(screen.getByText('Both fields are required.')).toBeTruthy(),
    );
  });

  it('shows an error when only the org URL is filled in', async () => {
    render(<LoginScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('https://dev.azure.com/yourorg'),
      'https://dev.azure.com/myorg',
    );
    fireEvent.press(screen.getByText('Sign In'));
    await waitFor(() =>
      expect(screen.getByText('Both fields are required.')).toBeTruthy(),
    );
  });
});

describe('LoginScreen – successful login', () => {
  it('calls login and getProjects with correct credentials', async () => {
    (api.getProjects as jest.Mock).mockResolvedValue([]);
    mockLogin.mockResolvedValue(undefined);

    render(<LoginScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('https://dev.azure.com/yourorg'),
      'https://dev.azure.com/myorg',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Paste your PAT here'),
      'valid-pat-token',
    );
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        'https://dev.azure.com/myorg',
        'valid-pat-token',
      );
      expect(api.getProjects).toHaveBeenCalled();
    });
  });
});

describe('LoginScreen – orgUrl pre-fill', () => {
  it('pre-fills orgUrl from store when session has expired', () => {
    setupAuthStore({ orgUrl: 'https://dev.azure.com/myorg' });
    render(<LoginScreen />);
    const orgInput = screen.getByPlaceholderText('https://dev.azure.com/yourorg');
    expect(orgInput.props.value).toBe('https://dev.azure.com/myorg');
  });
});

describe('LoginScreen – failed login', () => {
  it('shows an error message when the API rejects', async () => {
    mockLogin.mockResolvedValue(undefined);
    (api.getProjects as jest.Mock).mockRejectedValue(
      new Error('Session expired. Please sign in again.'),
    );

    render(<LoginScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('https://dev.azure.com/yourorg'),
      'https://dev.azure.com/myorg',
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('Paste your PAT here'),
      'bad-pat',
    );
    fireEvent.press(screen.getByText('Sign In'));

    await waitFor(() =>
      expect(
        screen.getByText('Session expired. Please sign in again.'),
      ).toBeTruthy(),
    );
    expect(mockExpireSession).toHaveBeenCalled();
  });
});
