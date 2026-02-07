import { IsNumber, Min } from 'class-validator';

export class ReportTrafficDto {
  @IsNumber()
  @Min(0)
  bytes: number;
}
