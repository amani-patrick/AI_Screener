'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';

interface ScreeningResult {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobId: string;
  shortlist?: {
    applicantId: string;
    rank: number;
    overallScore: number;
    skillsScore: number;
    experienceScore: number;
    educationScore: number;
    relevanceScore: number;
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
    reasoning: string;
    strengths: string[];
    gaps: string[];
  }[];
  errorMessage?: string;
  createdAt: string;
}

interface ScreeningResultProps {
  screeningId: string;
  onBack: () => void;
}

const getRecommendationColor = (rec: string) => {
  switch (rec) {
    case 'strong_yes':
      return 'bg-green-100 text-green-800';
    case 'yes':
      return 'bg-blue-100 text-blue-800';
    case 'maybe':
      return 'bg-yellow-100 text-yellow-800';
    case 'no':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRecommendationIcon = (rec: string) => {
  switch (rec) {
    case 'strong_yes':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'yes':
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    case 'maybe':
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    case 'no':
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
};

export function ScreeningResult({ screeningId, onBack }: ScreeningResultProps) {
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await axios.get(`/api/screenings/${screeningId}`);

        if (response.data.success) {
          setResult(response.data.data);

          // If still processing, poll every 2 seconds
          if (response.data.data.status === 'processing' || response.data.data.status === 'pending') {
            setTimeout(fetchResult, 2000);
          }
        } else {
          setError(response.data.error || 'Failed to fetch result');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch result');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [screeningId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading screening results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Result not found'}</AlertDescription>
        </Alert>
        <Button onClick={onBack} className="mt-4">
          Back to Form
        </Button>
      </div>
    );
  }

  const { status, shortlist, errorMessage } = result;

  if (status === 'failed') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>
            Screening failed: {errorMessage || 'Unknown error'}
          </AlertDescription>
        </Alert>
        <Button onClick={onBack} className="mt-4">
          Back to Form
        </Button>
      </div>
    );
  }

  if (status === 'pending' || status === 'processing') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Screening in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-blue-600" />
              <span>Your screening is being processed...</span>
            </div>
            <Progress value={50} className="w-full" />
            <p className="text-sm text-gray-600 mt-2">
              This may take a few minutes depending on the number of applicants.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button onClick={onBack} variant="outline">
          ← Back to Form
        </Button>
      </div>

      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span>Screening Results</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shortlist && shortlist.length > 0 ? (
            <div className="space-y-4">
              {shortlist
                .sort((a, b) => a.rank - b.rank)
                .map((candidate) => (
                  <Card key={candidate.applicantId} className="border-l-4 border-l-blue-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Rank #{candidate.rank}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Applicant ID: {candidate.applicantId}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getRecommendationIcon(candidate.recommendation)}
                          <Badge className={getRecommendationColor(candidate.recommendation)}>
                            {candidate.recommendation.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium">Overall Score</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {candidate.overallScore.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Skills</p>
                          <p className="text-lg">{candidate.skillsScore}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Experience</p>
                          <p className="text-lg">{candidate.experienceScore}%</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Relevance</p>
                          <p className="text-lg">{candidate.relevanceScore}%</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="font-medium mb-2">AI Reasoning:</p>
                        <p className="text-sm text-gray-700">{candidate.reasoning}</p>
                      </div>

                      {candidate.strengths && candidate.strengths.length > 0 && (
                        <div className="mb-2">
                          <p className="font-medium text-green-700">Strengths:</p>
                          <ul className="text-sm list-disc list-inside text-green-700">
                            {candidate.strengths.map((strength, idx) => (
                              <li key={idx}>{strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {candidate.gaps && candidate.gaps.length > 0 && (
                        <div>
                          <p className="font-medium text-orange-700">Areas for Improvement:</p>
                          <ul className="text-sm list-disc list-inside text-orange-700">
                            {candidate.gaps.map((gap, idx) => (
                              <li key={idx}>{gap}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No candidates in shortlist</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
