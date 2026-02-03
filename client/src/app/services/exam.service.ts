import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { GenerateExamResponse } from '../models/exam-response';
import { ValidateExamResponse } from '../models/validation-response';
import { AnswerValue } from '../store/exercise/exercise.state';
import { VoiceRecordingUtilityService } from './voice-recording-utility.service';

interface AnswerPayload {
  type: 'string' | 'number' | 'blob';
  value: string | number | null;
  blobData?: string; // base64 encoded blob
  blobType?: string; // MIME type of the blob
}

@Injectable({
  providedIn: 'root',
})
export class ExamService {
  private http = inject(HttpClient);
  private voiceRecordingUtilityService = inject(VoiceRecordingUtilityService);
  private readonly apiUrl = 'http://localhost:3000/api';

  /**
   * Generate exam exercises for the given type
   */
  generateExam(examType: string): Observable<GenerateExamResponse> {
    return this.http.get<GenerateExamResponse>(`${this.apiUrl}/exam/generate/${examType}`);
  }

  /**
   * Convert answer values to payload format
   */
  private async convertAnswersToPayload(answers: AnswerValue[]): Promise<AnswerPayload[]> {
    const payload: AnswerPayload[] = [];

    for (const answer of answers) {
      if (answer === null) {
        payload.push({ type: 'string', value: null });
      } else if (typeof answer === 'number') {
        payload.push({ type: 'number', value: answer });
      } else if (typeof answer === 'string') {
        payload.push({ type: 'string', value: answer });
      } else if (answer instanceof Blob) {
        const base64 = await this.voiceRecordingUtilityService.blobToBase64(answer);

        payload.push({
          type: 'blob',
          value: null,
          blobData: base64,
          blobType: answer.type,
        });
      }
    }

    return payload;
  }

  /**
   * Validate exam answers
   * Supports string, number, and Blob answer types
   */
  validateExam(examId: string, answers: AnswerValue[]): Observable<ValidateExamResponse> {
    return from(this.convertAnswersToPayload(answers)).pipe(
      switchMap((payload) => {
        return this.http.post<ValidateExamResponse>(`${this.apiUrl}/exam/${examId}/validate`, {
          answers: payload,
        });
      }),
    );
  }
}
