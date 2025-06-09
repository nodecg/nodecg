interface Vaadin {
  developmentModeCallback?: {
    'usage-statistics'?: () => void;
    'vaadin-license-checker'?: () => void;
  };
  registrations?: Array<{ is: string }>;
  usageStatsChecker?: {
    maybeGatherAndSend: () => void;
  };
}

interface Window {
  Vaadin: Vaadin;
}
