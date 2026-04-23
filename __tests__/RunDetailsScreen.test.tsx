import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import RunDetailsScreen from '../src/screens/RunDetailsScreen';
import { useRunDetails } from '../src/hooks/useRunDetails';

jest.mock('../src/hooks/useRunDetails', () => ({
  useRunDetails: jest.fn(),
}));

const mockFetch = jest.fn();

const navigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
};

const route = {
  params: {
    projectName: 'Project One',
    pipelineId: 42,
    runId: 99,
    runName: 'Run 99',
  },
};

beforeEach(() => {
  jest.clearAllMocks();
  (useRunDetails as jest.Mock).mockReturnValue({
    run: {
      id: 99,
      name: 'Run 99',
      state: 'completed',
      result: 'succeeded',
      createdDate: '2026-04-22T10:00:00.000Z',
      pipeline: { id: 42, name: 'Pipeline 42', folder: '\\', url: 'https://example.test/pipeline' },
      resources: {
        repositories: {
          self: { refName: 'refs/heads/main' },
        },
      },
      variables: {},
    },
    timeline: {
      id: 'timeline-1',
      records: [
        {
          id: 'stage-1',
          type: 'Stage',
          name: 'Build stage',
          state: 'completed',
          result: 'succeeded',
          order: 1,
          errorCount: 0,
          warningCount: 0,
        },
        {
          id: 'phase-1',
          parentId: 'stage-1',
          type: 'Phase',
          name: 'Agent phase',
          state: 'completed',
          result: 'succeeded',
          order: 1,
          log: { id: 11, url: 'https://example.test/logs/11' },
          errorCount: 0,
          warningCount: 0,
        },
        {
          id: 'job-1',
          parentId: 'phase-1',
          type: 'Job',
          name: 'Job 1',
          state: 'completed',
          result: 'succeeded',
          order: 1,
          log: { id: 12, url: 'https://example.test/logs/12' },
          errorCount: 0,
          warningCount: 0,
        },
        {
          id: 'task-1',
          parentId: 'job-1',
          type: 'Task',
          name: 'Restore packages',
          state: 'completed',
          result: 'succeeded',
          order: 1,
          log: { id: 13, url: 'https://example.test/logs/13' },
          errorCount: 0,
          warningCount: 0,
        },
        {
          id: 'task-2',
          parentId: 'job-1',
          type: 'Task',
          name: 'Run tests',
          state: 'completed',
          result: 'succeeded',
          order: 2,
          log: { id: 14, url: 'https://example.test/logs/14' },
          errorCount: 0,
          warningCount: 0,
        },
      ],
    },
    loading: false,
    error: null,
    fetch: mockFetch,
  });
});

describe('RunDetailsScreen', () => {
  it('renders nested timeline steps with their log actions', () => {
    render(<RunDetailsScreen navigation={navigation as never} route={route as never} />);

    expect(mockFetch).toHaveBeenCalledTimes(1);

    fireEvent.press(screen.getByText('Build stage'));
    fireEvent.press(screen.getByText('Agent phase'));
    fireEvent.press(screen.getByText('Job 1'));

    expect(screen.getByText('Restore packages')).toBeTruthy();
    expect(screen.getByText('Run tests')).toBeTruthy();
    expect(screen.getAllByText('Log')).toHaveLength(4);
  });
});