import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ResultsDisplayProps {
  matchPercentage: number;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

export default function ResultsDisplay({
  matchPercentage,
  matchedSkills,
  missingSkills,
  summary,
}: ResultsDisplayProps) {
  return (
    <div className="space-y-6">
      <Card className={`border ${matchPercentage >= 80 ? 'border-emerald-200 dark:border-emerald-800' : matchPercentage >= 60 ? 'border-amber-200 dark:border-amber-800' : 'border-red-200 dark:border-red-800'}`}>
        <CardContent className={`p-6 text-center ${matchPercentage >= 80 ? 'bg-emerald-50 dark:bg-emerald-950/50' : matchPercentage >= 60 ? 'bg-amber-50 dark:bg-amber-950/50' : 'bg-red-50 dark:bg-red-950/50'}`}>
          <h3 className="text-lg font-semibold mb-2">Match Score</h3>
          <div className={`text-5xl font-bold ${
            matchPercentage >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
            matchPercentage >= 60 ? 'text-amber-600 dark:text-amber-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {matchPercentage.toFixed(0)}%
          </div>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{summary}</p>
        </CardContent>
      </Card>

      <Card className="border">
        <CardHeader>
          <CardTitle>Matched Skills ({matchedSkills.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {matchedSkills.map((skill, index) => (
              <Badge key={index} variant="success">{skill}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {missingSkills.length > 0 && (
        <Card className="border">
          <CardHeader>
            <CardTitle>Missing Skills ({missingSkills.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, index) => (
                <Badge key={index} variant="destructive">{skill}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
