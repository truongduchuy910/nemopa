import { first, isArray, last, pickBy } from "lodash";
import { Model, SortOrder, Types } from "mongoose";

type Sort<T> = { [K in keyof T]: SortOrder };

export class CursorInputInterface {
  after?: string;

  before?: string;
}

export interface PagingInputInterface {
  until?: Date;

  since?: Date;

  limit?: number;

  offset?: number;

  cursors?: CursorInputInterface;

  size?: number;
}

interface Props<T> {
  filter: any;
  key?: keyof T;
  KeyType?: any;
  order?: SortOrder;
  cursors?: {
    after?: any;
    before?: any;
  };
}

/* eslint-disable */
export class Paging<T> {
  static ASC: SortOrder = 1;

  static DESC: SortOrder = -1;

  filter: any;

  condition: any; // original filter

  originSort: Sort<T>;

  sort: Sort<T>;

  key: keyof T;

  reverse = false;

  order: SortOrder;

  constructor(props: Props<T>) {
    this.cursor = this.cursor.bind(this);
    this.build = this.build.bind(this);
    let {
      key = "_id" as keyof T,
      KeyType = Types.ObjectId,
      cursors,
      filter = {},
      order = Paging.ASC,
    } = props;
    this.key = key;
    this.order = order;
    this.condition = Object.assign({}, filter);

    if (cursors) {
      const { after, before } = this.decrypt(cursors);
      if (after) {
        const { cursor } = after;
        filter[key] =
          order === Paging.ASC
            ? { $gt: KeyType ? new KeyType(cursor) : cursor }
            : { $lt: KeyType ? new KeyType(cursor) : cursor };
      }

      if (after && key !== "_id") {
        const { _id, cursor } = after;
        filter = {
          $or: [
            {
              ...this.condition,
              [key]: filter[key],
            },
            {
              ...this.condition,
              [key]: KeyType ? new KeyType(cursor) : cursor,
              _id:
                order === Paging.ASC
                  ? { $gt: new Types.ObjectId(_id) }
                  : { $lt: new Types.ObjectId(_id) },
            },
          ],
        };
      }

      if (before) {
        const { cursor } = before;
        this.reverse = true;
        filter[key] =
          order === Paging.ASC
            ? { $lt: KeyType ? new KeyType(cursor) : cursor }
            : { $gt: KeyType ? new KeyType(cursor) : cursor };
      }

      if (before && key !== "_id") {
        const { _id, cursor } = before;
        filter = {
          $or: [
            {
              ...this.condition,
              [key]: filter[key],
            },
            {
              ...this.condition,
              [key]: KeyType ? new KeyType(cursor) : cursor,
              _id:
                order === Paging.ASC
                  ? { $lt: new Types.ObjectId(_id) }
                  : { $gt: new Types.ObjectId(_id) },
            },
          ],
        };
      }
    }

    if (key !== "_id") {
      filter[key] ||= {};
      filter[key].$exists = true;
    }

    if (this.reverse) {
      this.sort = {
        [key]: order === Paging.ASC ? Paging.DESC : Paging.ASC,
      } as Sort<T>;
    } else {
      this.sort = { [key]: order } as Sort<T>;
    }
    this.sort["_id"] = this.sort[key];
    this.filter = pickBy(filter, (value) =>
      isArray(value)
        ? value.length > 0
        : value !== undefined && value !== null && value !== "",
    ) as { [P in keyof T]?: any };
  }

  decrypt(cursors: { after?: string; before?: string }) {
    return {
      after: cursors?.after && this.parse(cursors.after),
      before: cursors?.before && this.parse(cursors.before),
    };
  }

  parse(cursor: string) {
    return JSON.parse(cursor);
  }

  stringify(_id: string, cursor: any) {
    return JSON.stringify({ _id, cursor });
  }

  cursor(many: Array<T>) {
    const data = this.reverse ? many.reverse() : many;
    const lastCursor = last(data)?.[this.key];
    const lastId = last(data)?.["_id"];
    const afterCursor = this.stringify(lastId, lastCursor);
    let filterNext = Object.assign({}, this.filter);
    filterNext[this.key] =
      this.order === Paging.ASC ? { $gt: lastCursor } : { $lt: lastCursor };

    const fistCursor = first(data)?.[this.key];
    const firstId = first(data)?.["_id"];
    const beforeCursor = this.stringify(firstId, fistCursor);
    let filterPrevious = Object.assign({}, this.filter);
    filterPrevious[this.key] =
      this.order === Paging.ASC ? { $lt: fistCursor } : { $gt: fistCursor };

    if (this.key !== "_id") {
      filterNext = {
        $or: [
          { ...this.condition, [this.key]: filterNext[this.key] },
          {
            ...this.condition,
            [this.key]: lastCursor,
            _id: this.order === Paging.ASC ? { $gt: lastId } : { $lt: lastId },
          },
        ],
      };
      filterPrevious = {
        $or: [
          { ...this.condition, [this.key]: filterPrevious[this.key] },
          {
            ...this.condition,
            [this.key]: fistCursor,
            _id:
              this.order === Paging.ASC ? { $lt: firstId } : { $gt: firstId },
          },
        ],
      };
    }

    return {
      afterCursor,
      beforeCursor,
      filterNext,
      filterPrevious,
      data,
    };
  }

  async build(many: Array<T>, model: Model<T>) {
    const { afterCursor, beforeCursor, filterNext, filterPrevious, data } =
      this.cursor(many);
    const countPrevious = 1 || (await model.count(filterPrevious));
    const countNext = 1 || (await model.count(filterNext));
    const count = await model.count(this.filter);

    return {
      data,
      paging: {
        count,
        length: data.length,
        next: countNext ? { after: `${afterCursor}`, count: countNext } : null,
        previous: countPrevious
          ? { before: `${beforeCursor}`, count: countPrevious }
          : null,
      },
    };
  }
}

export class PagingWithPage<T> {
  limit?: number;
  offset?: number;
  skip?: number;
  size?: number;
  filter?: any;
  constructor(props: { filter: any; paging: PagingInputInterface }) {
    console.log(props.paging);
    this.size = Number(props?.paging?.size) || 10;
    this.limit = Number(props?.paging?.limit) || this.size;
    this.skip = Number(props?.paging?.offset) || 0;
    this.filter = props?.filter || {};
    this.build = this.build.bind(this);
  }

  async build(many: Array<T>, model: Model<T>) {
    const margin = 3;
    const count = await model.count(this.filter);
    const length = Math.ceil(count / this.size);
    const current = Math.ceil(this.skip / this.size) + 1;

    /**
     * page number
     */

    const pages = Array.from({ length }, (_v, i) => {
      return {
        more: false,
        current: i + 1 === current,
        index: i + 1,
        limit: this.size,
        offset: i * this.size,
      };
    });

    let from = current - margin;
    let to = current + margin;

    /**
     * left margin modify
     */
    if (from < 0) {
      to = to - from;
      from = 0;
    }

    /**
     * right margin modify
     */
    if (to > length) {
      from = from - (to - length);
      to = length;
    }
    const pagination = pages.slice(from, to);

    /**
     * last pagination node
     */
    if (!pagination.find((page) => page.index === length)) {
      pagination.push({
        more: true,
        current: length === current,
        index: length,
        limit: this.size,
        offset: (length - 1) * this.size,
      });
    }

    /**
     * fist pagination node
     */
    if (!pagination.find((page) => page.index === 1)) {
      pagination.unshift({
        more: true,
        current: 1 === current,
        index: 1,
        limit: this.size,
        offset: 0,
      });
    }

    return {
      count,
      from: this.skip,
      to: this.skip + many.length,
      pages: pagination,
    };
  }
}
