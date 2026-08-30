type RobotPapersAiConfig = {
  enabled: boolean;
  provider: string;
  baseUrl: string;
  model: string;
  hasApiKey: boolean;
  apiKeyMasked: string;
  systemPrompt: string;
};

type RobotPapersElectronApi = {
  getAiConfig: () => Promise<RobotPapersAiConfig>;
  saveAiConfig: (config: Partial<RobotPapersAiConfig> & { apiKey?: string }) => Promise<RobotPapersAiConfig>;
  testAiConnection: (config: Partial<RobotPapersAiConfig> & { apiKey?: string }) => Promise<{ ok: boolean; message: string }>;
  generateAi: (payload: { kind: 'daily' | 'weekly'; context: string; config?: Partial<RobotPapersAiConfig> & { apiKey?: string } }) => Promise<{ kind: 'daily' | 'weekly'; markdown: string }>;
  saveAiDocument: (payload: { kind: 'daily' | 'weekly'; date: string; weekStart?: string; fileName?: string; markdown: string; paperShortNames?: string[]; directions?: string[] }) => Promise<{ path: string; fileName: string }>;
  onLibraryUpdated: (callback: () => void) => () => void;
};

declare global {
  interface Window {
    robotPapers?: RobotPapersElectronApi;
  }
}

export {};
