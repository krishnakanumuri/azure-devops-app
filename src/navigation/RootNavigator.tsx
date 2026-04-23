import React, { useEffect, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { useAuthStore } from '../store';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import LoadingOverlay from '../components/LoadingOverlay';
import type { MainStackParamList } from '../types/navigation';

/** Extract a query parameter value from a URL string. */
function getQueryParam(url: string, param: string): string | null {
  const match = url.match(new RegExp('[?&]' + param + '=([^&]+)'));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Transforms incoming URLs before React Navigation processes them:
 *  1. Unwraps PWA protocol_handlers ?url= wrapper
 *     (e.g. https://myapp.com/?url=azuredevops%3A%2F%2Fprojects → azuredevops://projects)
 *  2. Unwraps Outlook SafeLinks (safelinks.protection.outlook.com?url=...)
 *  3. Converts Azure DevOps build notification URLs
 *     (dev.azure.com/.../web/build.aspx?pcguid=...&builduri=vstfs:///Build/Build/{id})
 *     to our internal scheme: azuredevops://resolve?pcguid=...&buildId=...
 */
function transformIncomingUrl(url: string): string {
  let target = url;

  // Unwrap protocol_handlers ?url= wrapper (PWA on Windows/Chrome/Edge)
  if (target.includes('?url=azuredevops') || target.includes('?url=http')) {
    const inner = getQueryParam(target, 'url');
    if (inner) target = inner;
  }

  // Unwrap Outlook SafeLinks
  if (target.includes('safelinks.protection.outlook.com')) {
    const inner = getQueryParam(target, 'url');
    if (inner) target = inner;
  }

  // Handle Azure DevOps build.aspx notification link
  if (target.includes('dev.azure.com') && target.includes('build.aspx')) {
    const pcguid = getQueryParam(target, 'pcguid');
    const builduri = getQueryParam(target, 'builduri');
    const buildIdMatch = builduri?.match(/Build\/(\d+)$/);
    if (pcguid && buildIdMatch) {
      return `azuredevops://resolve?pcguid=${encodeURIComponent(pcguid)}&buildId=${buildIdMatch[1]}`;
    }
  }

  return target;
}

// On web, prefix is just the origin. The base path (e.g. /azure-devops-app/) is baked
// into each screen path so React Navigation generates correct history URLs.
const prefixes: string[] = ['azuredevops://'];
if (Platform.OS === 'web') {
  const origin = (globalThis as Record<string, any>).location?.origin as string | undefined;
  if (origin) prefixes.push(origin + '/');
}

// Strip leading/trailing slashes → '' locally, 'azure-devops-app' on GitHub Pages.
const basePath = ((process.env.PUBLIC_URL as string | undefined) ?? '/').replace(/^\/|\/$/g, '');
const p = (path: string) => (basePath ? `${basePath}/${path}` : path);

const linking: LinkingOptions<MainStackParamList> = {
  prefixes,

  getInitialURL: async () => {
    const url = await Linking.getInitialURL();
    const transformed = url ? transformIncomingUrl(url) : null;

    // Save deep links so we can restore them after login.
    if (Platform.OS === 'web' && transformed) {
      const win = globalThis as Record<string, any>;
      const isLoginPath = transformed.endsWith('/Login') || transformed.endsWith('/');
      if (!isLoginPath) {
        win.sessionStorage?.setItem?.('pendingDeepLink', transformed);
      }
    }

    return transformed;
  },

  subscribe: listener => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      listener(transformIncomingUrl(url));
    });
    return () => sub.remove();
  },

  config: {
    screens: {
      Projects: p('projects'),
      Pipelines: {
        path: p('projects/:projectName/pipelines'),
        parse: { projectName: String },
      },
      Runs: {
        path: p('projects/:projectName/pipelines/:pipelineId/runs'),
        parse: { projectName: String, pipelineId: Number },
      },
      RunDetails: {
        path: p('projects/:projectName/pipelines/:pipelineId/runs/:runId'),
        parse: { projectName: String, pipelineId: Number, runId: Number },
      },
      QueueRun: {
        path: p('projects/:projectName/pipelines/:pipelineId/queue'),
        parse: { projectName: String, pipelineId: Number },
      },
      LogViewer: {
        path: p('projects/:projectName/builds/:buildId/logs/:logId'),
        parse: { projectName: String, buildId: Number, logId: Number },
      },
      BuildResolver: {
        path: p('resolve'),
        parse: { buildId: Number },
      },
    },
  },
};

export default function RootNavigator() {
  const { isAuthenticated, isLoading, loadStored } = useAuthStore();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    loadStored();
  }, [loadStored]);

  // After login, navigate to any pending deep link (saved before auth redirect changed the URL)
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated.current && Platform.OS === 'web') {
      wasAuthenticated.current = true;
      const win = globalThis as Record<string, any>;
      const pendingUrl = win.sessionStorage?.getItem?.('pendingDeepLink') as string | null;
      if (pendingUrl) {
        win.sessionStorage?.removeItem?.('pendingDeepLink');
        // Navigate to the pending deep link. Using location.href causes the app to reload at
        // the correct URL. Since credentials are now stored, the app will route correctly.
        setTimeout(() => { win.location && (win.location.href = pendingUrl); }, 50);
      }
    } else if (isAuthenticated) {
      wasAuthenticated.current = true;
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <NavigationContainer linking={linking}>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
