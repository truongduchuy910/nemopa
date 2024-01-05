import { Type } from "@nestjs/common";
import {
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
} from "@nestjs/graphql";

@ObjectType()
export class Pagination {
  @Field(() => Int, { nullable: true })
  totalDocs?: number;

  @Field(() => Int, { defaultValue: 10, nullable: true })
  limit?: number;

  @Field(() => Int, { defaultValue: 1, nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  totalPages?: number;

  @Field(() => Boolean, { nullable: true })
  nextPage?: boolean;

  @Field(() => Boolean, { nullable: true })
  prevPage?: boolean;

  @Field(() => Boolean, { nullable: true })
  hasPrevPage?: boolean;

  @Field(() => Boolean, { nullable: true })
  hasNextPage?: boolean;

  @Field(() => String, { nullable: true })
  paginationToken?: string;
}

@ObjectType()
export class BasePaginationResponse {
  @Field(() => Pagination)
  pagination: Pagination;
}

@InputType()
export class BasePaginationInput extends PartialType(
  PickType(Pagination, ["limit", "page", "paginationToken"] as const),
  InputType,
) {}

export interface IPaginatedType<T> {
  data: T[];
  pagination: Pagination;
}

export function Paginated<T>(classRef: Type<T>): Type<IPaginatedType<T>> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements IPaginatedType<T> {
    @Field(() => [classRef], { nullable: true })
    data: T[];

    @Field(() => Pagination, { nullable: true })
    pagination: Pagination;
  }
  return PaginatedType as Type<IPaginatedType<T>>;
}
