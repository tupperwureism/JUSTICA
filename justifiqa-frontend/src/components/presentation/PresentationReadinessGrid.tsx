import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PRESENTATION_CAPABILITIES, PRESENTATION_STATUS_LABELS, type PresentationDemoTab, type PresentationReadinessStatus } from './presentationReadinessModel';

const badgeVariant = (status: PresentationReadinessStatus) =>
  status === 'ACCEPTED_LOCAL' ? 'default' as const : status === 'BLOCKED' ? 'destructive' as const : 'outline' as const;

export function PresentationReadinessGrid({ onSelectTab }: { onSelectTab: (tab: PresentationDemoTab) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {PRESENTATION_CAPABILITIES.map((capability) => (
        <Card key={capability.id} className="h-full gap-4">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <CardTitle>{capability.title}</CardTitle>
              <Badge variant={badgeVariant(capability.status)}>{PRESENTATION_STATUS_LABELS[capability.status]}</Badge>
            </div>
            <CardDescription>{capability.summary}</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto text-xs font-medium text-muted-foreground">Evidence: {capability.evidence}</CardContent>
          {capability.demoTab && (
            <CardFooter>
              <Button type="button" variant="outline" className="min-h-10 w-full justify-between" onClick={() => onSelectTab(capability.demoTab!)}>
                {capability.status === 'ACCEPTED_LOCAL' ? 'Lihat alur lokal' : 'Lihat target UI'}
                <ArrowRight aria-hidden="true" />
              </Button>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
}