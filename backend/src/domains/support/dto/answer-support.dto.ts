import { IsString } from 'class-validator';

export class AnswerSupportDto {
  @IsString()
  answer: string;
}
