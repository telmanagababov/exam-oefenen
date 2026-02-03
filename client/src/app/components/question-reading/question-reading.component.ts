import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../../models/exam-response';

@Component({
  selector: 'app-question-reading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-reading.component.html',
  styleUrl: './question-reading.component.scss',
})
export class QuestionReadingComponent {
  question = input<Question | null>(null);
}
