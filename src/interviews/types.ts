export interface ReadmeFile {
  title: string;
  content: string;
}

export interface ImplementationDetails {
  steps: string[];
  tips: string[];
  testCases?: string;
}

export interface ApiRequest {
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
}

export interface ApiRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: (req: ApiRequest) => Promise<unknown>;
}

export interface InterviewPattern {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  estimatedTime: string;
  tags: string[];
  readmes?: ReadmeFile[];
  component?: React.ComponentType;  // Optional for code-review type
  type?: 'react' | 'coding-challenge' | 'code-review';  // Added code-review type
  implementationDetails?: ImplementationDetails;
  routes?: ApiRoute[];
}

export interface InterviewConfig {
  patterns: InterviewPattern[];
}
