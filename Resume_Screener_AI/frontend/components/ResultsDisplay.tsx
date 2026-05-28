import React from 'react';

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
  const getPercentageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPercentageBgColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-100';
    if (percentage >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Match Percentage */}
      <div className={`${getPercentageBgColor(matchPercentage)} rounded-lg p-6 text-center`}>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Match Score</h3>
        <div className={`text-6xl font-bold ${getPercentageColor(matchPercentage)}`}>
          {matchPercentage.toFixed(0)}%
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Summary</h3>
        <p className="text-gray-600">{summary}</p>
      </div>

      {/* Matched Skills */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Matched Skills ({matchedSkills.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {matchedSkills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Missing Skills */}
      {missingSkills.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            Missing Skills ({missingSkills.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {missingSkills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
