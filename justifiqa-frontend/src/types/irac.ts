export type LegalDocumentTemplateId = 'SOMASI_TERBUKA' | 'PERJANJIAN_DAMAI' | 'GUGATAN_SEDERHANA';

export interface IracAnalysis {
  id: string;
  caseTitle: string;
  storyOfFacts: string;
  issue: string;
  rule: string;
  application: string;
  conclusion: string;
  confidenceScore: number;
  generatedAt: string;
  relevantArticles: string[];
}

export interface DocumentClause {
  id: string;
  title: string;
  body: string;
}

export interface LegalDocumentDraft {
  id: string;
  templateId: LegalDocumentTemplateId;
  title: string;
  clientName: string;
  advocateName: string;
  opponentName: string;
  createdAt: string;
  clauses: DocumentClause[];
}
