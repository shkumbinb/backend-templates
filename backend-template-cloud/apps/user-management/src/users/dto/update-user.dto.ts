import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

/** Body of `PATCH /users/:id`. Same fields as create, all optional. */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
