import type { ExtensionSettings } from './settings';

export const BRIDGE_MESSAGE = {
  REQUEST_SETTINGS: 'GXT_REQUEST_SETTINGS',
  SETTINGS_UPDATE: 'GXT_SETTINGS_UPDATE',
  SAVE_SETTINGS: 'GXT_SAVE_SETTINGS',
  OPEN_SETTINGS: 'GXT_OPEN_SETTINGS',
} as const;

export type BridgeMessageType = (typeof BRIDGE_MESSAGE)[keyof typeof BRIDGE_MESSAGE];

export interface BridgePayloadMap {
  [BRIDGE_MESSAGE.REQUEST_SETTINGS]: undefined;
  [BRIDGE_MESSAGE.SETTINGS_UPDATE]: Partial<ExtensionSettings> | undefined;
  [BRIDGE_MESSAGE.SAVE_SETTINGS]: Partial<ExtensionSettings> | undefined;
  [BRIDGE_MESSAGE.OPEN_SETTINGS]: undefined;
}

type BridgeHandler<TType extends BridgeMessageType> = (payload: BridgePayloadMap[TType]) => void;

export function postBridgeMessage<TType extends BridgeMessageType>(
  type: TType,
  payload: BridgePayloadMap[TType]
): void {
  window.postMessage({ type, payload }, '*');
}

export function addBridgeListener<TType extends BridgeMessageType>(
  type: TType,
  handler: BridgeHandler<TType>
): () => void {
  const listener = (event: MessageEvent) => {
    if (event.source !== window) return;
    if (event.data?.type !== type) return;
    handler(event.data.payload as BridgePayloadMap[TType]);
  };
  window.addEventListener('message', listener, { passive: false });
  return () => window.removeEventListener('message', listener);
}
