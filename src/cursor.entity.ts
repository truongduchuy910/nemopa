import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CursorInputInterface, PagingInputInterface } from './paging';

/**
 * this pagination is implemented base on:
 * https://developers.facebook.com/docs/graph-api/results/
 */

@InputType()
export class CursorInput implements CursorInputInterface {
  @Field({
    nullable: true,
    description:
      'This is the cursor that points to the start of the page of data that has been returned.',
  })
  after?: string;

  @Field({
    nullable: true,
    description:
      'This is the cursor that points to the end of the page of data that has been returned.',
  })
  before?: string;
}

@InputType()
export class PagingInput implements PagingInputInterface {
  @Field({
    nullable: true,
    description:
      'A Unix timestamp or strtotime data value that points to the end of the range of time-based data.',
  })
  until?: Date;

  @Field({
    nullable: true,
    description:
      'A Unix timestamp or strtotime data value that points to the start of the range of time-based data.',
  })
  since?: Date;

  @Field({
    nullable: true,
    description:
      'This is the maximum number of objects that may be returned. A query may return fewer than the value of limit due to filtering. Do not depend on the number of results being fewer than the limit value to indicate that your query reached the end of the list of data, use the absence of next instead as described below. For example, if you set limit to 10 and 9 results are returned, there may be more data available, but one item was removed due to privacy filtering. Some edges may also have a maximum on the limit value for performance reasons. In all cases, the API returns the correct pagination links.',
  })
  limit?: number;

  @Field({
    nullable: true,
    description: 'This offsets the start of each page by the number specified.',
  })
  offset?: number;

  @Field({ nullable: true })
  cursors?: CursorInput;

  /**
   * Offset-based Area
   */

  @Field(() => Int, {
    nullable: true,
    defaultValue: 10,
    description:
      'Using to build pagination map. This is total results return per page.',
  })
  size?: number;
}

@ObjectType()
export class PagingNextEntity {
  @Field({ nullable: true })
  after?: string;

  @Field({ nullable: true })
  count?: number;
}

@ObjectType()
export class PagingPreviousEntity {
  @Field({ nullable: true })
  before?: string;

  @Field({ nullable: true })
  count?: number;
}

@ObjectType()
export class PageNumberEntity {
  @Field(() => Int, { nullable: true, description: 'Page index number.' })
  index: number;

  @Field({ nullable: true, description: 'Is paging of current data results?' })
  current?: boolean;

  @Field({
    nullable: true,
    description: 'Is Addtional pagination node? Sush as `...` label.',
  })
  more?: boolean;

  @Field(() => Int, {
    nullable: true,
    description: 'Paging limit variable.',
  })
  limit?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Paging offset variable.',
  })
  offset?: number;
}

@ObjectType()
export class PagingEntity {
  @Field(() => Int, {
    nullable: true,
    description: 'Total results return.',
  })
  length?: number;
  /**
   * Cursor-based Area
   */

  @Field({
    nullable: true,
    description:
      'Cursor-based pagination. The Graph API endpoint that will return the next page of data. If not included, this is the last page of data. Due to how pagination works with visibility and privacy, it is possible that a page may be empty but contain a next paging link. Stop paging when the next link no longer appears.',
  })
  next?: PagingNextEntity;

  @Field({
    nullable: true,
    description:
      'Cursor-based pagination. The Graph API endpoint that will return the previous page of data. If not included, this is the first page of data.',
  })
  previous?: PagingPreviousEntity;

  /**
   * Offset-based Area
   */

  @Field(() => Int, {
    nullable: true,
    description: 'Total results match with `WhereInput` in arguments.',
  })
  count?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Index `from` of results.',
  })
  from?: number;

  @Field(() => Int, {
    nullable: true,
    description: 'Index `to` of results.',
  })
  to?: number;

  @Field(() => [PageNumberEntity], {
    nullable: true,
    description:
      'Offset-based Pagination using with API have suffix `WithPage`. This is current items show in pagination component.',
  })
  pages: Array<PageNumberEntity>;
}
