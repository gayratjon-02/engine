import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  name?: string;
}
