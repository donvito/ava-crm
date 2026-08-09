import { PartialType } from "@nestjs/mapped-types";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import {
  CONTACT_STATUSES,
  ContactStatus,
  DEAL_STAGES,
  DealStage,
} from "../../../contracts";

const trim = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

const normalizedEmail = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toLowerCase() : value;

export class CreateContactDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  lastName!: string;

  @Transform(normalizedEmail)
  @IsEmail()
  @MaxLength(200)
  email!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  company!: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  phone?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsIn(CONTACT_STATUSES)
  status?: ContactStatus;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class UpdateContactDto extends PartialType(CreateContactDto) {}

export class ContactQueryDto {
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(["All", ...CONTACT_STATUSES])
  status?: ContactStatus | "All";
}

export class CreateDealDto {
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  company!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  value!: number;

  @Transform(({ value }) =>
    value === "" || value === null || value === undefined ? null : Number(value),
  )
  @IsOptional()
  @IsInt()
  @Min(1)
  contactId?: number | null;

  @IsOptional()
  @IsIn(DEAL_STAGES)
  stage?: DealStage;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probability?: number;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(10)
  closeDate?: string | null;
}

export class UpdateDealDto extends PartialType(CreateDealDto) {}

export class DealQueryDto {
  @IsOptional()
  @IsIn(DEAL_STAGES)
  stage?: DealStage;
}

export class CompleteTaskDto {
  @IsBoolean()
  completed!: boolean;
}
